function tokenize(query) {
  const tokens = [];
  const regex = /"([^"]*)"|(\(|\))|([^\s()]+)/g;
  let match;
  while ((match = regex.exec(query))) {
    if (match[1] !== undefined) {
      tokens.push({ type: 'TERM', value: match[1] });
    } else if (match[2] !== undefined) {
      tokens.push({ type: match[2] === '(' ? 'LPAREN' : 'RPAREN' });
    } else {
      const word = match[3];
      const upper = word.toUpperCase();
      if (upper === 'AND' || upper === 'OR' || upper === 'NOT') {
        tokens.push({ type: upper });
      } else {
        tokens.push({ type: 'TERM', value: word });
      }
    }
  }
  return tokens;
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }
  peek() {
    return this.tokens[this.pos];
  }
  next() {
    return this.tokens[this.pos++];
  }
  parseExpr() {
    return this.parseOr();
  }
  parseOr() {
    let node = this.parseAnd();
    while (this.peek()?.type === 'OR') {
      this.next();
      node = { type: 'OR', left: node, right: this.parseAnd() };
    }
    return node;
  }
  parseAnd() {
    let node = this.parseNot();
    while (this.peek() && this.peek().type !== 'OR' && this.peek().type !== 'RPAREN') {
      if (this.peek().type === 'AND') this.next();
      if (!this.peek() || this.peek().type === 'OR' || this.peek().type === 'RPAREN') break;
      node = { type: 'AND', left: node, right: this.parseNot() };
    }
    return node;
  }
  parseNot() {
    if (this.peek()?.type === 'NOT') {
      this.next();
      return { type: 'NOT', child: this.parseAtom() };
    }
    return this.parseAtom();
  }
  parseAtom() {
    const tok = this.peek();
    if (!tok) return { type: 'TERM', value: '' };
    if (tok.type === 'LPAREN') {
      this.next();
      const node = this.parseExpr();
      if (this.peek()?.type === 'RPAREN') this.next();
      return node;
    }
    if (tok.type === 'TERM') {
      this.next();
      return { type: 'TERM', value: tok.value };
    }
    this.next();
    return { type: 'TERM', value: '' };
  }
}

function evaluate(node, haystack) {
  switch (node.type) {
    case 'TERM':
      return node.value ? haystack.includes(node.value.toLowerCase()) : true;
    case 'AND':
      return evaluate(node.left, haystack) && evaluate(node.right, haystack);
    case 'OR':
      return evaluate(node.left, haystack) || evaluate(node.right, haystack);
    case 'NOT':
      return !evaluate(node.child, haystack);
    default:
      return true;
  }
}

export function matchesBooleanQuery(haystack, query) {
  if (!query || !query.trim()) return true;
  try {
    const tokens = tokenize(query);
    if (!tokens.length) return true;
    const ast = new Parser(tokens).parseExpr();
    return evaluate(ast, haystack.toLowerCase());
  } catch {
    return haystack.toLowerCase().includes(query.toLowerCase());
  }
}

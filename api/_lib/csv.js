export function extractLinkedinUrl(text) {
  const match = (text || '').match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_%]+\/?/);
  return match ? match[0] : null;
}

export function stripLinkedInConnectionsPreamble(text) {
  const lines = text.split(/\r?\n/);
  const headerIdx = lines.findIndex(l => /^"?first name"?,/i.test(l.trim()));
  if (headerIdx === -1) return text;
  return lines.slice(headerIdx).join('\n');
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\r') {
      // skip, \n handles the line break
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [headerRow, ...dataRows] = rows.filter(r => r.some(cell => cell.trim() !== ''));
  const headers = headerRow.map(h => h.trim());

  return dataRows.map(cells => {
    const record = {};
    headers.forEach((header, idx) => {
      record[header] = (cells[idx] ?? '').trim();
    });
    return record;
  });
}

const FIELD_ALIASES = {
  firstName: ['first name'],
  lastName: ['last name'],
  name: ['name', 'full name'],
  title: ['title', 'job title', 'person title'],
  company: ['company', 'company name', 'organization', 'organization name'],
  country: ['country', 'person country'],
  city: ['city', 'person city'],
  linkedinUrl: ['person linkedin url', 'linkedin url', 'linkedin', 'li_profile_url', 'url'],
  website: ['website', 'company website url', 'website url'],
  email: ['email', 'person email', 'email address'],
  phone: ['phone', 'phone number', 'mobile phone', 'corporate phone'],
};

FIELD_ALIASES.title.push('position');

function findField(record, aliasKey) {
  const aliases = FIELD_ALIASES[aliasKey];
  const lowerKeys = Object.keys(record).reduce((acc, k) => {
    acc[k.toLowerCase()] = k;
    return acc;
  }, {});
  for (const alias of aliases) {
    if (lowerKeys[alias]) return record[lowerKeys[alias]] || '';
  }
  return '';
}

export function mapApolloRecord(record) {
  const first = findField(record, 'firstName');
  const last = findField(record, 'lastName');
  const fullName = findField(record, 'name');
  const name = fullName || [first, last].filter(Boolean).join(' ');

  return {
    name,
    title: findField(record, 'title') || null,
    company: findField(record, 'company') || null,
    country: findField(record, 'country') || null,
    city: findField(record, 'city') || null,
    linkedin_url: findField(record, 'linkedinUrl') || null,
    website: findField(record, 'website') || null,
    email: findField(record, 'email') || null,
    phone: findField(record, 'phone') || null,
  };
}

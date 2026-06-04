// plugin: hn firebase api (J001) [
//:= this.frame('client.exec')

this.dbgbrk('J001 Hacker News Firebase')
var self = this

if (!window.__lcHnFb) {
  window.__lcHnFb = true

  var HN_FB_BASE = 'https://hacker-news.firebaseio.com/v0/'
  var HN_ITEM_ID = 48357725
  var HN_ITEM_URL = 'https://news.ycombinator.com/item?id=' + HN_ITEM_ID
  var HN_RELOAD_MS = 10000

  var seen = {}
  var P1 = '///!@#~~'

  function decodeHtmlEntities(s) {
    return s
      .replace(/&#x([0-9a-f]+);/gi, function (_, hex) {
        return String.fromCharCode(parseInt(hex, 16))
      })
      .replace(/&#(\d+);/g, function (_, num) {
        return String.fromCharCode(parseInt(num, 10))
      })
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
  }

  function htmlChunkToText(chunk) {
    var s = chunk
      .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?p>/gi, '')
      .replace(/<[^>]+>/g, '')
    return decodeHtmlEntities(s).trim()
  }

  function htmlToText(html) {
    if (!html) return ''
    var parts = html.split(/<p>/i)
    var lines = []
    for (var i = 0; i < parts.length; i++) {
      var line = htmlChunkToText(parts[i])
      if (line) lines.push(line)
    }
    return lines.join('\n')
  }

  function fetchJson(path) {
    return fetch(HN_FB_BASE + path, { credentials: 'omit', cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('hn fb http ' + r.status + ' ' + path)
        return r.json()
      })
  }

  function fetchItem(id, progress) {
    progress.schedule(id)
    return fetchJson('item/' + id + '.json').then(function (item) {
      progress.complete(item || { id: id })
      return item
    })
  }

  function objectPath(parentPath, segmentName) {
    return parentPath ? parentPath + P1 + segmentName : segmentName
  }

  function firstLine(text) {
    if (!text) return ''
    var lines = text.split('\n')
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim()
      if (line) return line
    }
    return ''
  }

  function countryFlag(iso2) {
    var c = (iso2 || '').toUpperCase()
    if (c.length !== 2) return ''
    return String.fromCodePoint(
      0x1f1e6 + c.charCodeAt(0) - 65,
      0x1f1e6 + c.charCodeAt(1) - 65
    )
  }

  function isoRe(codes) {
    return new RegExp('(?:^|[^A-Za-z])(' + codes + ')(?:[^A-Za-z]|$)')
  }

  function commaIsoRe(code) {
    return new RegExp(',\\s*' + code + '(?:[^A-Za-z]|$)')
  }

  var LC_COMMA_CITY_COUNTRY = {
    DE: /\b(?:Berlin|Munich|Hamburg|Frankfurt|Cologne|Freiburg|Stuttgart|Dusseldorf|Düsseldorf|Eindhoven)\b/i,
    NL: /\b(?:Hague|Amsterdam|Rotterdam|Utrecht|The\s*Hague)\b/i,
    FR: /\b(?:Paris|Lyon|Marseille|Bordeaux|Toulouse|Nice)\b/i,
    ES: /\b(?:Barcelona|Madrid|Valencia|Seville)\b/i,
    IT: /\b(?:Rome|Milan|Turin|Florence|Bologna)\b/i,
    CH: /\b(?:Zurich|Geneva|Basel|Bern|Lausanne)\b/i,
    SE: /\b(?:Stockholm|Gothenburg|Malm(?:o|ö))\b/i,
    NO: /\b(?:Oslo|Bergen|Trondheim)\b/i,
    DK: /\b(?:Copenhagen|Aarhus)\b/i,
    FI: /\b(?:Helsinki|Tampere|Espoo)\b/i,
    PL: /\b(?:Warsaw|Krakow|Wroc(?:l|ł)aw)\b/i,
    AT: /\b(?:Vienna|Salzburg|Graz)\b/i,
    BE: /\b(?:Brussels|Antwerp|Ghent)\b/i,
    PT: /\b(?:Lisbon|Porto)\b/i,
    CZ: /\b(?:Prague|Brno)\b/i,
    IE: /\b(?:Dublin|Cork|Galway)\b/i,
    JP: /\b(?:Tokyo|Osaka|Kyoto|Yokohama)\b/i,
    CN: /\b(?:Beijing|Shanghai|Shenzhen|Guangzhou)\b/i,
    IN: /\b(?:Bangalore|Bengaluru|Mumbai|Delhi|Hyderabad|Pune|Chennai|Noida)\b/i,
    AU: /\b(?:Sydney|Melbourne|Brisbane|Perth|Canberra)\b/i,
    CO: /\b(?:Bogot(?:a|á)|Medell(?:i|í)n)\b/i,
    GR: /\b(?:Athens|Thessaloniki)\b/i
  }

  var LC_US_STATE_AMBIG = { DE: 1, CO: 1, IN: 1, ME: 1, GA: 1, MA: 1, PA: 1, ID: 1, LA: 1, MT: 1, NE: 1, SC: 1, SD: 1, TN: 1 }
  var LC_US_STATE = {
    AL: 1, AK: 1, AZ: 1, AR: 1, CA: 1, CO: 1, CT: 1, DE: 1, FL: 1, GA: 1, HI: 1, ID: 1, IL: 1, IN: 1,
    IA: 1, KS: 1, KY: 1, LA: 1, ME: 1, MD: 1, MA: 1, MI: 1, MN: 1, MS: 1, MO: 1, MT: 1, NE: 1, NV: 1,
    NH: 1, NJ: 1, NM: 1, NY: 1, NC: 1, ND: 1, OH: 1, OK: 1, OR: 1, PA: 1, RI: 1, SC: 1, SD: 1, TN: 1,
    TX: 1, UT: 1, VT: 1, VA: 1, WA: 1, WV: 1, WI: 1, WY: 1, DC: 1
  }
  var LC_CA_PROVINCE = { ON: 1, BC: 1, AB: 1, QC: 1, MB: 1, SK: 1, NS: 1, NB: 1, PE: 1, NT: 1, YT: 1, NU: 1 }

  var LC_COMMA_CODE_MAP = { UK: 'GB', EL: 'GR' }

  var LC_JOB_TITLE =
    /\b(?:engineer|developer|designer|manager|analyst|intern|director|lead|principal|staff|senior|junior|founding|head\s+of|researcher|architect|specialist|consultant|scientist|product\s+manager|program\s+manager|VP\b|CTO\b|CEO\b|COO\b|account\s+executive|solutions\s+engineer|recruiter)\b/i
  var LC_LOCATION_HINT =
    /\b(?:remote|wfh|onsite|on[\s-]?site|hybrid|distributed|worldwide|global|anywhere|\d+\s*days?\s*(?:\/|per\s*)?week)\b/i

  var LC_EARTH = '\u{1F30D}'
  var LC_WIFI = '\u{1F6DC}'

  var LC_REMOTE_RE =
    /\b(?:remote|wfh|work\s*from\s*home|anywhere|worldwide|distributed|fully\s*remote|100%\s*remote|remote[\s-]?first|work\s*from\s*home)\b/i
  var LC_SF_RE =
    /\b(?:SF|San\s*Fran(?:s|c)isco|Bay\s*Area|Palo\s*Alto|Mountain\s*View|Sunnyvale|Cupertino|Menlo\s*Park|Redwood\s*City|Oakland|Berkeley|San\s*Jose|Silicon\s*Valley|San\s*Mateo|San\s*Carlos|Redwood\s*City|Flatiron|Fidi)\b/i

  // cs = case-sensitive (ISO codes); omit short codes from /i rules — they match English words (in, it, no, be, at, co)
  var LC_LOCATION_RULES = [
    { key: 'remote', re: LC_REMOTE_RE, icon: LC_EARTH },
    { key: 'sf', re: LC_SF_RE, icon: '\u{1F984}' },
    {
      key: 'us',
      re: /\b(?:United\s*States|US[\s-]?only|North\s*America|Americas(?:\s*East)?|U\.S\.[\s-]?based|within\s*(?:the\s*)?contiguous\s*USA)\b/i,
      icon: countryFlag('US')
    },
    { key: 'us', re: isoRe('US|USA|U\\.S\\.A?\\.?'), icon: countryFlag('US'), cs: true },
    {
      key: 'us',
      re: /\b(?:NYC|New\s*York(?:\s*City)?|LA|Los\s*Angeles|Seattle|Boston|Austin|Denver|Chicago|Miami|Portland|Atlanta|Dallas|Houston|Phoenix|Philadelphia|San\s*Diego|Washington(?:\s*DC)?|Raleigh|Nashville|Salt\s*Lake\s*City|Minneapolis|Detroit|Charlotte|Indianapolis|Columbus|Cleveland|Pittsburgh|Baltimore|San\s*Antonio|Las\s*Vegas|Sacramento|Boise|Madison|Ann\s*Arbor|Research\s*Triangle|Arizona|Brooklyn|Maryland|Waltham|Newton|Albuquerque|Dayton|Durham|NC|Menlo\s*Park|Peninsula|Hybrid\s*\(USA\)|Texas|(?:^|[^A-Za-z])DC(?:[^A-Za-z]|$))\b/i,
      icon: countryFlag('US')
    },
    { key: 'us', re: /,\s*CA\b/, icon: countryFlag('US'), cs: true },
    {
      key: 'us',
      re: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:AL|AK|AZ|AR|CA|CO|CT|FL|HI|IL|IA|KS|KY|MD|MA|MI|MN|MS|MO|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|TN|TX|UT|VT|VA|WA|WI|DC)\b/,
      icon: countryFlag('US'),
      cs: true
    },
    {
      key: 'uk',
      re: /\b(?:UK|United\s*Kingdom|Britain|Great\s*Britain|England|Scotland|Wales|Northern\s*Ireland|London|Cambridge\s*UK|Oxford|Sheffield)\b/i,
      icon: countryFlag('GB')
    },
    { key: 'uk', re: isoRe('UK|GB'), icon: countryFlag('GB'), cs: true },
    {
      key: 'eu',
      re: /\b(?:EU|EEA|Europe|European\s*Union|wider\s*Europe|Western\s*Europe|EMEA|EU\s*time\s*zone)\b/i,
      icon: countryFlag('EU')
    },
    { key: 'eu', re: isoRe('EU'), icon: countryFlag('EU'), cs: true },
    {
      key: 'ca',
      re: /\b(?:Canada|Canadian|Toronto|Vancouver|Montreal|Ottawa|Calgary|Waterloo\s*ON|North\s*America)\b/i,
      icon: countryFlag('CA')
    },
    {
      key: 'fr',
      re: /\b(?:France|French|Paris|Lyon|Marseille|Bordeaux)\b/i,
      icon: countryFlag('FR')
    },
    { key: 'fr', re: isoRe('FR'), icon: countryFlag('FR'), cs: true },
    {
      key: 'de',
      re: /\b(?:Germany|German|Berlin|Munich|Frankfurt|Hamburg|Cologne|Freiburg|Hamburg|Eindhoven)\b/i,
      icon: countryFlag('DE')
    },
    { key: 'de', re: isoRe('DE'), icon: countryFlag('DE'), cs: true },
    {
      key: 'nl',
      re: /\b(?:The\s+Netherlands|Netherlands|Dutch|Amsterdam|Rotterdam|The\s*Hague|\bHague\b|Eindhoven|Utrecht)\b/i,
      icon: countryFlag('NL')
    },
    { key: 'nl', re: isoRe('NL'), icon: countryFlag('NL'), cs: true },
    { key: 'nl', re: commaIsoRe('NL'), icon: countryFlag('NL'), cs: true },
    {
      key: 'ie',
      re: /\b(?:Ireland|Irish|Dublin|Cork|Galway)\b/i,
      icon: countryFlag('IE')
    },
    { key: 'ie', re: isoRe('IE'), icon: countryFlag('IE'), cs: true },
    {
      key: 'es',
      re: /\b(?:Spain|Spanish|Barcelona|Madrid|Valencia|Seville)\b/i,
      icon: countryFlag('ES')
    },
    { key: 'es', re: isoRe('ES'), icon: countryFlag('ES'), cs: true },
    {
      key: 'it',
      re: /\b(?:Italy|Italian|Rome|Milan|Turin|Florence)\b/i,
      icon: countryFlag('IT')
    },
    { key: 'it', re: isoRe('IT'), icon: countryFlag('IT'), cs: true },
    {
      key: 'ch',
      re: /\b(?:Switzerland|Swiss|Zurich|Geneva|Basel|Bern)\b/i,
      icon: countryFlag('CH')
    },
    { key: 'ch', re: isoRe('CH'), icon: countryFlag('CH'), cs: true },
    {
      key: 'se',
      re: /\b(?:Sweden|Swedish|Stockholm|Gothenburg|Malm(?:o|ö))\b/i,
      icon: countryFlag('SE')
    },
    { key: 'se', re: isoRe('SE'), icon: countryFlag('SE'), cs: true },
    {
      key: 'no',
      re: /\b(?:Norway|Norwegian|Oslo|Bergen|Trondheim)\b/i,
      icon: countryFlag('NO')
    },
    { key: 'no', re: isoRe('NO'), icon: countryFlag('NO'), cs: true },
    {
      key: 'dk',
      re: /\b(?:Denmark|Danish|Copenhagen|Aarhus)\b/i,
      icon: countryFlag('DK')
    },
    { key: 'dk', re: isoRe('DK'), icon: countryFlag('DK'), cs: true },
    {
      key: 'fi',
      re: /\b(?:Finland|Finnish|Helsinki|Espoo|Tampere)\b/i,
      icon: countryFlag('FI')
    },
    { key: 'fi', re: isoRe('FI'), icon: countryFlag('FI'), cs: true },
    {
      key: 'pl',
      re: /\b(?:Poland|Polish|Warsaw|Krakow|Wroc(?:l|ł)aw)\b/i,
      icon: countryFlag('PL')
    },
    { key: 'pl', re: isoRe('PL'), icon: countryFlag('PL'), cs: true },
    {
      key: 'at',
      re: /\b(?:Austria|Austrian|Vienna|Salzburg|Graz)\b/i,
      icon: countryFlag('AT')
    },
    { key: 'at', re: isoRe('AT'), icon: countryFlag('AT'), cs: true },
    {
      key: 'be',
      re: /\b(?:Belgium|Belgian|Brussels|Antwerp|Ghent)\b/i,
      icon: countryFlag('BE')
    },
    { key: 'be', re: isoRe('BE'), icon: countryFlag('BE'), cs: true },
    {
      key: 'pt',
      re: /\b(?:Portugal|Portuguese|Lisbon|Porto)\b/i,
      icon: countryFlag('PT')
    },
    { key: 'pt', re: isoRe('PT'), icon: countryFlag('PT'), cs: true },
    {
      key: 'cz',
      re: /\b(?:Czech(?:ia)?|Prague|Brno)\b/i,
      icon: countryFlag('CZ')
    },
    { key: 'cz', re: isoRe('CZ'), icon: countryFlag('CZ'), cs: true },
    {
      key: 'ro',
      re: /\b(?:Romania|Romanian|Bucharest|Cluj)\b/i,
      icon: countryFlag('RO')
    },
    { key: 'ro', re: isoRe('RO'), icon: countryFlag('RO'), cs: true },
    {
      key: 'hu',
      re: /\b(?:Hungary|Hungarian|Budapest)\b/i,
      icon: countryFlag('HU')
    },
    { key: 'hu', re: isoRe('HU'), icon: countryFlag('HU'), cs: true },
    {
      key: 'gr',
      re: /\b(?:Greece|Greek|Athens\b(?!\s*,?\s*GA)|Thessaloniki)\b/i,
      icon: countryFlag('GR')
    },
    { key: 'gr', re: isoRe('GR'), icon: countryFlag('GR'), cs: true },
    {
      key: 'il',
      re: /\b(?:Israel|Israeli|Tel\s*Aviv|Jerusalem|Haifa)\b/i,
      icon: countryFlag('IL')
    },
    { key: 'il', re: isoRe('IL'), icon: countryFlag('IL'), cs: true },
    {
      key: 'in',
      re: /\b(?:India|Indian|Bangalore|Bengaluru|Mumbai|Delhi|Hyderabad|Pune|Chennai|Noida)\b/i,
      icon: countryFlag('IN')
    },
    {
      key: 'au',
      re: /\b(?:Australia|Australian|Sydney|Melbourne|Brisbane|Perth|Canberra)\b/i,
      icon: countryFlag('AU')
    },
    { key: 'au', re: isoRe('AU'), icon: countryFlag('AU'), cs: true },
    {
      key: 'nz',
      re: /\b(?:New\s*Zealand|Auckland|Wellington|Christchurch)\b/i,
      icon: countryFlag('NZ')
    },
    { key: 'nz', re: isoRe('NZ'), icon: countryFlag('NZ'), cs: true },
    {
      key: 'jp',
      re: /\b(?:Japan|Japanese|Tokyo|Osaka|Kyoto|Yokohama)\b/i,
      icon: countryFlag('JP')
    },
    { key: 'jp', re: isoRe('JP'), icon: countryFlag('JP'), cs: true },
    {
      key: 'sg',
      re: /\b(?:Singapore)\b/i,
      icon: countryFlag('SG')
    },
    { key: 'sg', re: isoRe('SG'), icon: countryFlag('SG'), cs: true },
    {
      key: 'hk',
      re: /\b(?:Hong\s*Kong)\b/i,
      icon: countryFlag('HK')
    },
    { key: 'hk', re: isoRe('HK'), icon: countryFlag('HK'), cs: true },
    {
      key: 'tw',
      re: /\b(?:Taiwan|Taipei|Taichung)\b/i,
      icon: countryFlag('TW')
    },
    { key: 'tw', re: isoRe('TW'), icon: countryFlag('TW'), cs: true },
    {
      key: 'kr',
      re: /\b(?:South\s*Korea|Korea|Seoul|Busan)\b/i,
      icon: countryFlag('KR')
    },
    { key: 'kr', re: isoRe('KR'), icon: countryFlag('KR'), cs: true },
    {
      key: 'cn',
      re: /\b(?:China|Chinese|Beijing|Shanghai|Shenzhen|Guangzhou)\b/i,
      icon: countryFlag('CN')
    },
    { key: 'cn', re: isoRe('CN'), icon: countryFlag('CN'), cs: true },
    {
      key: 'br',
      re: /\b(?:Brazil|Brazilian|S(?:a|ã)o\s*Paulo|Rio(?:\s*de\s*Janeiro)?)\b/i,
      icon: countryFlag('BR')
    },
    { key: 'br', re: isoRe('BR'), icon: countryFlag('BR'), cs: true },
    {
      key: 'mx',
      re: /\b(?:Mexico|Mexican|Mexico\s*City|Guadalajara|Monterrey)\b/i,
      icon: countryFlag('MX')
    },
    { key: 'mx', re: isoRe('MX'), icon: countryFlag('MX'), cs: true },
    {
      key: 'ar',
      re: /\b(?:Argentina|Argentine|Buenos\s*Aires)\b/i,
      icon: countryFlag('AR')
    },
    { key: 'ar', re: isoRe('AR'), icon: countryFlag('AR'), cs: true },
    {
      key: 'co',
      re: /\b(?:Colombia|Colombian|Bogot(?:a|á)|Medell(?:i|í)n)\b/i,
      icon: countryFlag('CO')
    },
    { key: 'co', re: isoRe('CO'), icon: countryFlag('CO'), cs: true },
    {
      key: 'cl',
      re: /\b(?:Chile|Chilean|Santiago\b(?!\s*,?\s*CA))\b/i,
      icon: countryFlag('CL')
    },
    { key: 'cl', re: isoRe('CL'), icon: countryFlag('CL'), cs: true },
    {
      key: 'ae',
      re: /\b(?:UAE|Dubai|Abu\s*Dhabi|United\s*Arab\s*Emirates)\b/i,
      icon: countryFlag('AE')
    },
    { key: 'ae', re: isoRe('AE'), icon: countryFlag('AE'), cs: true },
    {
      key: 'sa',
      re: /\b(?:Saudi\s*Arabia|Riyadh|Jeddah)\b/i,
      icon: countryFlag('SA')
    },
    { key: 'sa', re: isoRe('SA'), icon: countryFlag('SA'), cs: true },
    {
      key: 'za',
      re: /\b(?:South\s*Africa|Johannesburg|Cape\s*Town|Durban)\b/i,
      icon: countryFlag('ZA')
    },
    { key: 'za', re: isoRe('ZA'), icon: countryFlag('ZA'), cs: true },
    {
      key: 'ng',
      re: /\b(?:Nigeria|Lagos|Abuja)\b/i,
      icon: countryFlag('NG')
    },
    { key: 'ng', re: isoRe('NG'), icon: countryFlag('NG'), cs: true },
    {
      key: 'eg',
      re: /\b(?:Egypt|Egyptian|Cairo)\b/i,
      icon: countryFlag('EG')
    },
    { key: 'eg', re: isoRe('EG'), icon: countryFlag('EG'), cs: true },
    {
      key: 'tr',
      re: /\b(?:Turkey|Turkish|Istanbul|Ankara)\b/i,
      icon: countryFlag('TR')
    },
    { key: 'tr', re: isoRe('TR'), icon: countryFlag('TR'), cs: true },
    {
      key: 'ru',
      re: /\b(?:Russia|Russian|Moscow|St\.?\s*Petersburg)\b/i,
      icon: countryFlag('RU')
    },
    { key: 'ru', re: isoRe('RU'), icon: countryFlag('RU'), cs: true },
    {
      key: 'ua',
      re: /\b(?:Ukraine|Ukrainian|Kyiv|Kiev|Lviv)\b/i,
      icon: countryFlag('UA')
    },
    { key: 'ua', re: isoRe('UA'), icon: countryFlag('UA'), cs: true },
    {
      key: 'vn',
      re: /\b(?:Vietnam|Vietnamese|Ho\s*Chi\s*Minh(?:\s*City)?|Hanoi)\b/i,
      icon: countryFlag('VN')
    },
    { key: 'vn', re: isoRe('VN'), icon: countryFlag('VN'), cs: true },
    {
      key: 'hr',
      re: /\b(?:Croatia|Croatian|Dubrovnik|Zagreb)\b/i,
      icon: countryFlag('HR')
    },
    { key: 'hr', re: isoRe('HR'), icon: countryFlag('HR'), cs: true },
    {
      key: 'latam',
      re: /\b(?:LATAM|LatAm|Latin\s*America|South\s*America)\b/i,
      icon: countryFlag('BR')
    },
    {
      key: 'sea',
      re: /\b(?:APAC|SEA[\s-]?based|Southeast\s*Asia)\b/i,
      icon: LC_EARTH
    }
  ]

  var LC_NON_COUNTRY_KEYS = { remote: true, sf: true }

  function isGlobalRemoteScope(text) {
    return /\b(?:worldwide|global|anywhere|almost\s*anywhere(?:\s*in\s*the\s*world)?|everywhere|all\s*remote)\b/i.test(
      text
    )
  }

  function hasCountryScope(hits) {
    for (var i = 0; i < hits.length; i++) {
      if (!LC_NON_COUNTRY_KEYS[hits[i].key]) return true
    }
    return false
  }

  var LC_COMMA_COUNTRY_NAME =
    /,\s*(?:The\s+)?(?:Netherlands|Germany|France|Italy|Spain|Canada|Ireland|Sweden|Norway|Denmark|Finland|Poland|Belgium|Switzerland|Austria|Portugal|Greece|Romania|Hungary|Czechia|Czech\s+Republic|Croatia|India|Australia|New\s+Zealand|Japan|Korea|China|Singapore|Israel|Brazil|Mexico|Argentina|Colombia|Chile|South\s+Africa|United\s+Arab\s+Emirates|Saudi\s+Arabia|Turkey|Russia|Ukraine|Vietnam|United\s+States|United\s+Kingdom|UK|Philippines|Indonesia|Malaysia|Thailand|Taiwan|Hong\s+Kong|Egypt|Nigeria|Kenya|Morocco|Pakistan|Bangladesh|Peru|Ecuador|Uruguay|Paraguay|Bolivia|Serbia|Bulgaria|Slovakia|Slovenia|Lithuania|Latvia|Estonia|Iceland|Luxembourg|Cyprus|Malta|Qatar|Kuwait|Bahrain|Oman|Jordan|Lebanon|Iraq|Iran|Afghanistan|Nepal|Sri\s+Lanka|Myanmar|Cambodia|Laos|Mongolia|Kazakhstan|Uzbekistan|Georgia|Armenia|Azerbaijan|Belarus|Moldova|Albania|North\s+Macedonia|Montenegro|Bosnia|Herzegovina|Panama|Costa\s+Rica|Guatemala|Honduras|El\s+Salvador|Nicaragua|Cuba|Jamaica|Trinidad|Dominican\s+Republic|Puerto\s+Rico|Venezuela|Libya|Tunisia|Algeria|Ethiopia|Tanzania|Uganda|Ghana|Senegal|Ivory\s+Coast|Cameroon|Angola|Mozambique|Zimbabwe|Botswana|Namibia|Madagascar|Mauritius|Fiji|Papua\s+New\s+Guinea)\b/i

  var LC_GEOGRAPHIC =
    /\b(?:The\s+Netherlands|Netherlands|Germany|France|Italy|Spain|Canada|Ireland|Sweden|Norway|Denmark|Finland|Poland|Belgium|Switzerland|Austria|Portugal|Greece|Romania|Hungary|Czechia|Croatia|India|Australia|Japan|China|Singapore|Israel|Brazil|Mexico|Argentina|Colombia|United\s+States|United\s+Kingdom|NYC|SF|LA|Chicago|Boston|Seattle|Amsterdam|London|Paris|Berlin|Tokyo|Sydney|Toronto|Vancouver|Dublin|Stockholm|Oslo|Copenhagen|Helsinki|Warsaw|Brussels|Zurich|Vienna|Lisbon|Barcelona|Madrid|Milan|Rome|Seoul|Mumbai|Bangalore|Dubai|Hong\s+Kong|Taipei|Auckland|Mexico\s+City|S(?:a|ã)o\s*Paulo|Buenos\s+Aires|Bogot(?:a|á)|Tel\s+Aviv|Jerusalem|Prague|Budapest|Bucharest|Athens|Ho\s+Chi\s+Minh|Hanoi|Manila|Jakarta|Bangkok|Kuala\s+Lumpur|New\s+Delhi|Hyderabad|Chennai|Pune|Noida|Montreal|Ottawa|Calgary|Edinburgh|Glasgow|Manchester|Liverpool|Cambridge|Oxford|Sheffield|Munich|Frankfurt|Hamburg|Cologne|Eindhoven|Rotterdam|The\s+Hague|Utrecht|Lyon|Marseille|Geneva|Basel|Bern|Gothenburg|Oslo|Bergen|Trondheim|Aarhus|Tampere|Krakow|Warsaw|Brno|Cluj|Dubrovnik|Zagreb|Reykjavik|Luxembourg|Valletta|Nicosia|Sofia|Belgrade|Skopje|Podgorica|Sarajevo|Ljubljana|Bratislava|Vilnius|Riga|Tallinn|Kyiv|Kiev|Lviv|Moscow|St\.?\s*Petersburg|Istanbul|Ankara|Riyadh|Jeddah|Abu\s+Dhabi|Doha|Manama|Muscat|Amman|Beirut|Baghdad|Tehran|Kabul|Kathmandu|Colombo|Yangon|Phnom\s+Penh|Vientiane|Ulaanbaatar|Almaty|Tashkent|Tbilisi|Yerevan|Baku|Minsk|Chisinau|Tirana|Pristina|Santo\s+Domingo|San\s+Juan|Caracas|Tripoli|Tunis|Algiers|Addis\s+Ababa|Nairobi|Kampala|Accra|Dakar|Abidjan|Douala|Luanda|Maputo|Harare|Gaborone|Windhoek|Antananarivo|Port\s+Louis|Suva|Port\s+Moresby|Austin|Dallas|Houston|San\s+Antonio|Fort\s+Worth|El\s+Paso|Arlington|Plano|Irving|Texas|Denver|Miami|Atlanta|Philadelphia|Phoenix|Portland|Las\s+Vegas|San\s+Diego|Minneapolis|Detroit|Charlotte|Nashville|Raleigh|Salt\s+Lake\s+City|Boise|Madison|Brooklyn|Menlo\s+Park|Redwood\s+City|Palo\s+Alto|Mountain\s+View|Sunnyvale|Cupertino|San\s+Jose|Oakland|Berkeley|San\s+Francisco|Bay\s+Area|Silicon\s+Valley)\b/i

  var LC_US_CITY_STATE =
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:AL|AK|AZ|AR|CA|CO|CT|FL|HI|IL|IA|KS|KY|MD|MA|MI|MN|MS|MO|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|TN|TX|UT|VT|VA|WA|WI|DC)\b/

  function cleanJobPart(part) {
    return (part || '')
      .replace(/\(\s*https?:\/\/[^)]+\)/gi, '')
      .replace(/\s*https?:\/\/\S+/gi, '')
      .trim()
  }

  function isWorkModeOnlySegment(part) {
    var t = cleanJobPart(part)
    if (/^(?:ONSITE|HYBRID|REMOTE|WFH)$/i.test(t)) return true
    if (/^(?:ONSITE|On-site|Onsite|HYBRID|Hybrid|REMOTE|Remote|WFH)\s+(?:onsite|on-site|only|first|preferred?|OK)$/i.test(t)) {
      return true
    }
    if (/^(?:ONSITE|On-site|Onsite|On\s+Site|In-office|In\s+office|In-person|In\s+person)\b/i.test(t)) {
      if (/\d+\s*days?\b/i.test(t) && !LC_US_CITY_STATE.test(t) && !LC_COMMA_COUNTRY_NAME.test(t)) {
        return true
      }
      if (!LC_US_CITY_STATE.test(t) && !LC_COMMA_COUNTRY_NAME.test(t) && !/,/.test(t) && !LC_GEOGRAPHIC.test(t)) {
        return true
      }
    }
    return false
  }

  function isCityOnlySegment(part) {
    var text = cleanJobPart(part)
    if (!text || text.length > 40) return false
    if (LC_JOB_TITLE.test(text)) return false
    if (LC_LOCATION_HINT.test(text)) return false
    if (isMetaSegment(part)) return false
    return segmentMatchesLocationRules(part)
  }

  var LC_META_SEGMENT =
    /^(?:full[\s-]?time(?:\s*,\s*part[\s-]?time)?|part[\s-]?time(?:\s*,\s*full[\s-]?time)?|contract(?:\s*to\s*full[\s-]?time)?|intern(?:ship)?|co[\s-]?op|salary\s*:|equity\s*:|benefits\s*:|profit[\s-]?sharing.*)$/i

  function isMetaSegment(part) {
    if (!part) return true
    if (/^https?:\/\//i.test(part)) return true
    if (/^[\$€£]/.test(part)) return true
    if (/^\d[\d,.\s]*(?:k|K|USD|CAD|EUR|GBP|€|£|\$)/.test(part)) return true
    if (LC_META_SEGMENT.test(part)) return true
    return false
  }

  function segmentMatchesLocationRules(part) {
    var text = cleanJobPart(part)
    if (!text) return false
    for (var i = 0; i < LC_LOCATION_RULES.length; i++) {
      if (LC_LOCATION_RULES[i].key === 'remote') continue
      if (matchLocationRule(text, LC_LOCATION_RULES[i])) return true
    }
    if (/,\s*[A-Z]{2}\b/.test(text)) return true
    if (/,\s*(?:USA|UK|UAE)\b/.test(text)) return true
    if (LC_COMMA_COUNTRY_NAME.test(text)) return true
    if (LC_US_CITY_STATE.test(text)) return true
    return false
  }

  function scoreLocationSegment(part) {
    if (!part || isMetaSegment(part)) return -1
    var text = cleanJobPart(part)
    if (!text) return -1
    if (isWorkModeOnlySegment(part)) return 6
    var score = 0
    if (/^location\s*:/i.test(text)) score += 30
    if (/,\s*[A-Z]{2}\b/.test(text)) score += 24
    if (/,\s*(?:USA|UK|UAE)\b/.test(text)) score += 24
    if (LC_US_CITY_STATE.test(text)) score += 28
    if (LC_COMMA_COUNTRY_NAME.test(text)) score += 28
    if (LC_GEOGRAPHIC.test(text)) score += 26
    if (isCityOnlySegment(part)) score += 36
    if (LC_LOCATION_HINT.test(text) && !isWorkModeOnlySegment(part)) score += 18
    if (segmentMatchesLocationRules(part)) score += 14
    if (/^\s*(?:ONSITE|HYBRID|REMOTE)\b/i.test(text) && !isWorkModeOnlySegment(part)) score += 12
    if (text.length <= 80 && !LC_JOB_TITLE.test(text)) score += 4
    if (LC_JOB_TITLE.test(text) && score < 12) score -= 10
    return score
  }

  function splitJobParts(line) {
    var parts = line.split('|')
    var out = []
    for (var i = 0; i < parts.length; i++) out.push(parts[i].trim())
    return out
  }

  function pickLocationText(line) {
    if (!line) return ''
    var t = line.trim()
    if (/^location\s*:/i.test(t)) return t.replace(/^location\s*:/i, '').trim()
    if (t.indexOf('|') === -1) return t.replace(/\s*https?:\/\/\S+/gi, '').trim()

    var parts = splitJobParts(t)
    var bestScore = 0
    var best = []
    for (var i = 0; i < parts.length; i++) {
      var s = scoreLocationSegment(parts[i])
      if (s > bestScore) {
        bestScore = s
        best = [parts[i]]
      } else if (s > 0 && s === bestScore) {
        best.push(parts[i])
      }
    }
    if (best.length) return best.join(' | ')

    // Classic: Company | Role | Location | URL
    if (parts.length >= 4 && /^https?:\/\//i.test(parts[parts.length - 1])) return parts[parts.length - 2]
    if (parts.length >= 3 && !/^https?:\/\//i.test(parts[2])) return parts[2]
    return parts[parts.length - 1]
  }

  function resolveCommaCode(code, segment) {
    var c = (code || '').toUpperCase()
    if (c === 'UK') return { key: 'uk', iso: 'GB' }
    if (c === 'USA') return { key: 'us', iso: 'US' }
    if (c === 'UAE') return { key: 'ae', iso: 'AE' }
    if (c === 'NL') {
      if (/\b(?:St\.?\s*John|Newfoundland|Labrador)\b/i.test(segment)) return { key: 'ca', iso: 'CA' }
      return { key: 'nl', iso: 'NL' }
    }
    if (LC_COMMA_CITY_COUNTRY[c] && LC_COMMA_CITY_COUNTRY[c].test(segment)) {
      return { key: c.toLowerCase(), iso: c }
    }
    if (LC_US_STATE_AMBIG[c]) {
      if (LC_COMMA_CITY_COUNTRY[c] && LC_COMMA_CITY_COUNTRY[c].test(segment)) {
        return { key: c.toLowerCase(), iso: c }
      }
      return { key: 'us', iso: 'US' }
    }
    if (LC_US_STATE[c]) return { key: 'us', iso: 'US' }
    if (LC_CA_PROVINCE[c]) return { key: 'ca', iso: 'CA' }
    if (c === 'CA' && !/\bCanada\b/i.test(segment)) return { key: 'us', iso: 'US' }
    var iso = LC_COMMA_CODE_MAP[c] || c
    return { key: c.toLowerCase(), iso: iso }
  }

  function commaCountryHits(text) {
    var hits = []
    var re = /,\s*([A-Z]{2})\b/g
    var m
    while ((m = re.exec(text))) {
      var resolved = resolveCommaCode(m[1], text)
      hits.push({ index: m.index, key: resolved.key, icon: countryFlag(resolved.iso) })
    }
    re = /,\s*(USA|UK|UAE)\b/g
    while ((m = re.exec(text))) {
      var alias = m[1].toUpperCase()
      var resolvedAlias = resolveCommaCode(alias, text)
      hits.push({ index: m.index, key: resolvedAlias.key, icon: countryFlag(resolvedAlias.iso) })
    }
    return hits
  }

  function isJobListingLine(line) {
    if (!line) return false
    var t = line.trim()
    if (/^location\s*:/i.test(t)) return true
    if (/\((?:remote|onsite|on[\s-]?site|hybrid|US|USA|EU|UK|Canada)[^)]{0,60}\)/i.test(t)) {
      return true
    }
    if (t.indexOf('|') !== -1) {
      var parts = splitJobParts(t)
      for (var i = 0; i < parts.length; i++) {
        if (scoreLocationSegment(parts[i]) > 0) return true
      }
    }
    if (t.indexOf('|') === -1) {
      return /\b(?:remote|onsite|on[\s-]?site|hybrid|wfh)\b/i.test(t) &&
        /\b(?:US|USA|UK|EU|Canada|Europe|global|worldwide|India|France|Germany|London|Paris|SF|NYC)\b/i.test(t)
    }
    if (/https?:\/\//i.test(t)) return true
    if (/\b(?:remote|onsite|on[\s-]?site|hybrid|wfh|full[\s-]?time|part[\s-]?time|contract|intern)\b/i.test(t)) {
      return true
    }
    return t.split('|').length >= 3
  }

  function locationTextFromJobLine(line) {
    return pickLocationText(line)
  }

  function matchLocationRule(text, rule) {
    return text.match(rule.re)
  }

  function locationIconsFromText(text) {
    if (!text) return ''
    var hits = []
    for (var i = 0; i < LC_LOCATION_RULES.length; i++) {
      var rule = LC_LOCATION_RULES[i]
      var m = matchLocationRule(text, rule)
      if (m) {
        hits.push({ index: m.index, key: rule.key, icon: rule.icon })
      }
    }
    var commaHits = commaCountryHits(text)
    for (var c = 0; c < commaHits.length; c++) hits.push(commaHits[c])
    if (!hits.length) return ''
    hits.sort(function (a, b) {
      return a.index - b.index
    })
    var seen = {}
    var icons = []
    var scopedRemote = hasCountryScope(hits) && !isGlobalRemoteScope(text)
    for (var j = 0; j < hits.length; j++) {
      if (seen[hits[j].key]) continue
      seen[hits[j].key] = true
      var icon = hits[j].icon
      if (hits[j].key === 'remote' && scopedRemote) icon = LC_WIFI
      icons.push(icon)
    }
    return icons.length ? ' ' + icons.join('') : ''
  }

  function locationIconsFromJobLine(line) {
    if (!isJobListingLine(line)) return ''
    return locationIconsFromText(locationTextFromJobLine(line))
  }

  function storySegmentName(item) {
    var title = (item && item.title) || 'post'
    if (/who is hiring/i.test(title)) return 'Who is hiring?'
    return title.replace(/^Ask HN:\s*/i, '').trim() || 'post'
  }

  function commentSegmentName(item, usedNames) {
    var user = item.by || 'unknown'
    var line = firstLine(htmlToText(item.text || ''))
    var icons = line ? locationIconsFromJobLine(line) : ''
    var base = line ? user + ' - ' + line : user + '/' + item.id
    var maxBase = Math.max(0, 160 - icons.length)
    if (base.length > maxBase && maxBase > 3) base = base.slice(0, maxBase - 3) + '...'
    var name = base + icons
    if (usedNames && usedNames[name]) name = name + '/' + item.id
    if (usedNames) usedNames[name] = true
    return name
  }

  function itemText(item) {
    if (!item || !item.id) return ''
    if (item.type === 'comment') {
      var text = htmlToText(item.text || '')
//      var line = firstLine(text)
//      if (line.indexOf('|') !== -1) return line
      return text
    }
    if (item.type === 'story' || item.type === 'job' || item.type === 'poll') {
      var parts = []
      if (item.title) parts.push(item.title)
      if (item.text) parts.push(htmlToText(item.text))
      return parts.join('\n\n').trim()
    }
    return ''
  }

  function segmentNameForItem(item, usedNames) {
    if (item.type === 'comment') return commentSegmentName(item, usedNames)
    if (item.type === 'story' || item.type === 'job' || item.type === 'poll') {
      return storySegmentName(item)
    }
    return 'item/' + item.id
  }

  function buildThreadScope(rootItem, progress) {
    var lines = []
    var objects = {}

    function buildTreeNode(item, usedNames, progress) {
      if (!item || !item.id) return Promise.resolve(null)
      var text = itemText(item)
      var seg = segmentNameForItem(item, usedNames)
      var node = { segmentName: seg, text: text, children: [] }
      var kids = item.kids
      if (!kids || !kids.length) return Promise.resolve(node)
      var childUsed = {}
      return Promise.all(
        kids.map(function (kidId) {
          return fetchItem(kidId, progress).then(function (kid) {
            return buildTreeNode(kid, childUsed, progress)
          })
        })
      ).then(function (childNodes) {
        for (var i = 0; i < childNodes.length; i++) {
          if (childNodes[i]) node.children.push(childNodes[i])
        }
        return node
      })
    }

    function layoutNode(node, parentPath) {
      if (!node) return parentPath
      if (node.text) {
        var start = lines.length
        var textLines = node.text.split('\n')
        for (var i = 0; i < textLines.length; i++) lines.push(textLines[i])
        var path = objectPath(parentPath, node.segmentName)
        for (var j = 0; j < node.children.length; j++) {
          layoutNode(node.children[j], path)
        }
        lines.push('')
        var end = lines.length
        var slice = lines.slice(start, end).join('\n')
        objects[path] = {
          lines: [start, end],
          hash: calcMD5(slice),
          uid: calcMD5(path)
        }
        return path
      }
      for (var k = 0; k < node.children.length; k++) {
        layoutNode(node.children[k], parentPath)
      }
      return parentPath
    }

    return buildTreeNode(rootItem, null, progress).then(function (root) {
      layoutNode(root, '')
      var source = lines.join('\n')
      return {
        name: storySegmentName(rootItem),
        extlang: 'text',
        uid: calcMD5(HN_ITEM_URL),
        objects: objects,
        source: source
      }
    })
  }

  function fetchThreadScope(id, progress) {
    return fetchItem(id, progress).then(function (item) {
      if (!item) return null
      return buildThreadScope(item, progress)
    })
  }

  function menuViewportBottom() {
    var m = document.getElementById('menu')
    if (!m) return 0
    return m.getBoundingClientRect().bottom
  }
  function scrollToScopeEl(el) {
    if (!el || !el.length) return
    var dom = el[0]
    if (!dom || typeof dom.scrollIntoView !== 'function') return
    if (!dom || !dom.getBoundingClientRect) return
    function run() {
      dom.scrollIntoView({ block: 'start' })
      if (typeof dom.scrollIntoView === 'function') {
        dom.scrollIntoView({ block: 'start' })
      }
      var refY = menuViewportBottom()
      var dy = dom.getBoundingClientRect().top - refY
      if (Math.abs(dy) < 0.5) return
      window.scrollBy(0, dy)
    }
    run()
  }

  function pushParsed(scope) {
    var mv = window.__lcMainView
    if (!mv || typeof mv.updateStateObject !== 'function') return false
    if (!scope || !scope.source) return false
    if (seen[scope.name] === scope.source) return false
    seen[scope.name] = scope.source
    var el = mv.updateStateObject(
      {
        name: scope.name,
        extlang: scope.extlang,
        objects: scope.objects,
        uid: scope.uid
      },
      scope.source
    )
    scrollToScopeEl(el)
    return true
  }

  function scan() {
    self.dbgbrk('J001 scan item ' + HN_ITEM_ID)
    resetFetchProgress()
    syncFbButton()
    return fetchThreadScope(HN_ITEM_ID, fetchProgress)
      .then(function (scope) {
        return pushParsed(scope)
      })
      .catch(function (e) {
        console.warn('HN Firebase scan failed:', e)
        return false
      })
  }

  var autoOn = false
  var timer = null
  var scanning = false
  var fetchProgress = null
  var lastFetchTotal = 0

  function resetFetchProgress() {
    fetchProgress = {
      fetched: 0,
      total: 0,
      known: {},
      schedule: function (id) {
        if (this.known[id]) return
        this.known[id] = true
        this.total++
        syncFbButton()
      },
      complete: function (item) {
        this.fetched++
        var kids = item && item.kids
        if (kids) {
          for (var i = 0; i < kids.length; i++) this.schedule(kids[i])
        }
        syncFbButton()
      }
    }
  }

  function syncFbButton() {
    var $b = $('#btnHNFB')
    var busy = autoOn || scanning
    $b.toggleClass('lc-hnfb-on', busy)
    $b.prop('disabled', scanning)
    $b.attr('aria-pressed', autoOn ? 'true' : 'false')
    $b.attr('aria-busy', scanning ? 'true' : 'false')
    var label = 'Hiring HN'
    if (scanning) {
      if (fetchProgress && fetchProgress.total) {
        label =
          'Hiring HN (' +
          fetchProgress.fetched +
          '/' +
          fetchProgress.total +
          ') Please wait until loading is complete. Relax, don\'t scroll'
      } else {
        label = 'Please wait until loading…'
      }
    } else if (lastFetchTotal) {
      label = 'Hiring HN (' + lastFetchTotal + ')'
    }
    $b.find('.lc-hnfb-label').text(label)
    var title = autoOn
      ? 'HN Firebase: auto-reload every 10s (on)'
      : 'HN Firebase: auto-reload every 10s (off)'
    if (scanning) {
      title =
        fetchProgress && fetchProgress.total
          ? 'Please wait until loading — ' +
            fetchProgress.fetched +
            '/' +
            fetchProgress.total +
            ' items'
          : 'Please wait until loading…'
    } else if (lastFetchTotal) {
      title = 'HN Firebase: ' + lastFetchTotal + ' items loaded'
    }
    $b.attr('title', title)
  }

  function setAuto(on) {
    self.dbgbrk(`J001 setAuto ${on}`)
    autoOn = !!on
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    if (autoOn) {
      runScan()
//      timer = setInterval(runScan, HN_RELOAD_MS)
    }
    syncFbButton()
  }

  function runScan() {
    if (scanning) return
    scanning = true
    syncFbButton()
    scan().then(
      function () {
        if (fetchProgress && fetchProgress.total) {
          lastFetchTotal = fetchProgress.total
        }
        scanning = false
        setAuto(false) // disable auto-reload
      },
      function () {
        scanning = false
        setAuto(false) // disable auto-reload
      }
    )
  }

  function initMenu() {
    if ($('#btnHNFB').length) return
    $('#menu').prepend(
      "<button id='btnHNFB' type='button'><span class='lc-hnfb-icon' aria-hidden='true'></span><span class='lc-hnfb-label'>Hiring HN</span></button>"
    )
    $('#btnHNFB').click(function () {
      setAuto(!autoOn)
      runScan()
    })
    syncFbButton()
  }

  function waitForMainView(cb) {
    var tries = 0
    var t = setInterval(function () {
      if (window.__lcMainView) {
        clearInterval(t)
        cb()
      } else if (++tries > 150) {
        clearInterval(t)
        console.warn('HN Firebase: MainView not ready')
      }
    }, 100)
  }

  $(function () {
    initMenu()
//    waitForMainView(runScan)
  })
}

// plugin: hn firebase api (J001) ]
// ./hn-fb.css [
//:= this.frame('client.css')
#menu #btnHNFB {
  background-color: rgb(255, 102, 0);
  color: #000;
  border: none;
  padding: 5px 10px;
  margin-right: 5px;
  cursor: pointer;
  font-weight: 700;
}
#menu #btnHNFB:hover,
#menu #btnHNFB:active {
  background-color: rgb(230, 92, 0);
}
#menu #btnHNFB:disabled {
  cursor: wait;
  opacity: 0.92;
}
#menu #btnHNFB:disabled:hover,
#menu #btnHNFB:disabled:active {
  background-color: rgb(255, 102, 0);
}
#menu #btnHNFB .lc-hnfb-icon {
  display: none;
  margin-right: 4px;
  font-size: 14px;
  line-height: 1;
  vertical-align: middle;
}
#menu #btnHNFB .lc-hnfb-icon::before {
  content: '\21BB';
}
#menu #btnHNFB.lc-hnfb-on .lc-hnfb-icon {
  display: inline-block;
  animation: lc-hnfb-spin 1s linear infinite;
}
@keyframes lc-hnfb-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
// ./hn-fb.css ]

/**
 * cryptoWalletService.js
 * Servicio de billeteras ValensCoin (VAL) — Testnet L1
 * Generación BIP-39, derivación de direcciones valens1q..., QR URI y transferencias locales.
 * Decimals = 0 → todas las operaciones son enteros estrictos.
 */

// ── Constantes de Tokenomics ──────────────────────────────────────────────────
export const TOTAL_SUPPLY   = 1_000_000_000_000;  // 1 billón (1T) de VAL (sin decimales)
export const DECIMALS       = 0;
export const FAUCET_AMOUNT  = 5;              // +5 VAL por reclamación
export const AIRDROP_AMOUNT = 10;             // 10 VAL de bienvenida
export const VALENS_PREFIX  = 'valens1q';     // Prefijo de dirección Testnet L1

// ── Vocabulario BIP-39 reducido (250 palabras cripto-friendly) ────────────────
const BIP39_MINI = [
  'abandon','ability','able','about','above','absent','absorb','abstract','absurd','abuse',
  'access','accident','account','accuse','achieve','acid','acoustic','acquire','across','act',
  'action','actor','actual','adapt','add','addict','address','adjust','admit','adult',
  'advance','advice','aerobic','afford','afraid','again','age','agent','agree','ahead',
  'aim','air','airport','aisle','alarm','album','alcohol','alert','alien','all',
  'alley','allow','almost','alone','alpha','already','also','alter','always','amateur',
  'amazing','among','amount','amused','analyst','angry','animal','another','answer','antenna',
  'antique','anxiety','any','apart','approve','april','arcade','arctic','area','arena',
  'argue','arm','armor','army','around','arrange','arrest','arrive','arrow','art',
  'artefact','artist','artwork','ask','aspect','assault','asset','assist','assume','asthma',
  'athlete','atom','attack','attend','attitude','attract','auction','august','aunt','author',
  'auto','autumn','average','avocado','award','awesome','awful','awkward','axis','baby',
  'balance','bamboo','banner','barely','barrel','base','basic','basket','battle','beach',
  'beauty','because','become','beef','before','begin','behave','behind','believe','below',
  'belt','bench','benefit','best','betray','better','between','beyond','bicycle','bid',
  'bike','bind','biology','bird','birth','bitter','black','blade','blame','blanket',
  'blast','bleak','bless','blind','blood','blossom','blouse','blue','blur','blush',
  'board','boat','body','boil','bomb','bone','book','boost','border','boring',
  'borrow','boss','bottom','bounce','box','boy','bracket','brain','brand','brave',
  'bread','breeze','brick','bridge','brief','bright','bring','brisk','broccoli','broken',
  'bronze','broom','brother','brown','brush','bubble','buddy','budget','buffalo','build',
  'bulb','bulk','bullet','bundle','bunker','burden','burger','burst','bus','business',
  'busy','butter','buyer','buzz','cabbage','cabin','cable','cadete','call','calm',
  'camera','camp','can','canal','cancel','candy','cannon','canvas','canyon','capable',
  'capital','captain','car','carbon','card','cargo','carpet','carry','cart','case',
  'cash','casino','castle','casual','cat','catalog','catch','category','cattle','caught',
  'cause','caution','cave','ceiling','celery','cement','census','century','cereal','certain',
  'chair','chaos','chapter','charge','chase','chat','cheap','check','cheese','chef',
  'cherry','chest','chicken','chief','child','chimney','choice','choose','chronic','chuckle',
  'chunk','cigar','cinnamon','circle','citizen','city','civil','claim','clap','clarify',
  'claw','clay','clean','clerk','clever','click','client','cliff','climb','clinic',
  'clip','clock','clog','close','cloth','cloud','clown','club','clump','cluster',
  'clutch','coach','coast','coconut','code','coffee','coil','coin','collect','color',
  'column','combine','come','comfort','comic','common','company','concert','conduct','confirm',
  'congress','connect','consider','control','convince','cook','cool','copper','copy','coral',
  'core','corn','correct','cost','cotton','couch','country','couple','course','cousin',
  'cover','coyote','crack','cradle','craft','cram','crane','crash','crazy','cream',
  'credit','creek','crew','cricket','crime','crisp','critic','cross','crouch','crowd',
  'crucial','cruel','cruise','crumble','crunch','crush','cry','crystal','cube','culture',
  'cup','cupboard','curious','current','curtain','curve','cushion','custom','cute','cycle',
  'dad','damage','dance','danger','daring','dash','daughter','dawn','day','deal',
  'debate','debris','decade','december','decide','decline','decorate','decrease','deer','defense',
  'define','defy','degree','delay','deliver','demand','demise','denial','dentist','deny',
  'depart','depend','deposit','depth','deputy','derive','describe','desert','design','desk',
  'despair','destroy','detail','detect','develop','device','devote','diagram','dial','diamond',
  'dilemma','dinner','dinosaur','direct','dirt','disagree','discover','disease','dish','dismiss',
  'disorder','display','distance','divert','divide','divorce','dizzy','doctor','document','dog',
  'doll','dolphin','domain','donate','door','dose','double','dove','draft','dragon',
  'drama','drastic','draw','dream','dress','drift','drink','drip','drive','drop',
  'drum','dry','duck','dumb','dune','during','dust','dutch','duty','dwarf',
  'dynamic','eager','eagle','early','earn','earth','easily','east','edge','effort',
  'eight','either','elbow','elder','electric','elegant','element','elephant','elite','else',
  'embark','embody','embrace','emerge','emotion','employ','empower','empty','enable','enact',
  'endless','endorse','enemy','energy','enforce','engage','engine','enhance','enjoy','enlist',
  'enough','enrich','enroll','ensure','enter','entire','entry','envelope','episode','equal',
  'equip','erase','erode','erosion','error','erupt','escape','essay','essence','estate',
  'eternal','evidence','evil','evolve','excess','exchange','excite','exclude','exercise','exhaust',
  'exhibit','exile','exist','exit','exotic','expand','expire','explain','expose','express',
  'extend','extra','eye','fable','face','faculty','faint','faith','fall','false',
  'fame','family','famous','fan','fancy','fantasy','far','fashion','fat','fatal',
  'father','fatigue','fault','favorite','feature','february','federal','fee','feed','feel',
  'feet','fellow','felt','fence','festival','fetch','fever','few','fiber','fiction',
  'field','figure','file','film','filter','final','find','fine','finger','finish',
  'fire','firm','first','fiscal','fish','fix','flag','flame','flash','flat',
  'flee','flight','flip','float','flock','floor','flower','fly','foam','follow',
  'food','foot','force','forest','forget','fork','fortune','forum','forward','fossil',
  'foster','found','fox','fragile','frame','freedom','fringe','frog','front','frown',
  'frozen','fruit','fuel','fun','funny','furnace','fury','future','gadget','galaxy',
  'gallery','game','gap','garbage','garden','garlic','garment','gas','gasp','gate',
  'gather','gauge','gaze','general','genius','genre','gentle','genuine','gesture','ghost',
  'giant','gift','giggle','ginger','giraffe','girl','give','glad','glance','glare',
  'glass','glide','glimpse','globe','gloom','glory','glove','glow','glue','goat',
  'goddess','gold','good','goose','gorilla','gospel','gossip','govern','gown','grab',
  'grace','grain','grant','grape','grasp','grass','gravity','great','green','grid',
  'grief','grit','grocery','group','grow','grunt','guard','guide','guilt','guitar',
  'gun','gym','habit','hair','half','hamster','hand','happy','harsh','harvest',
  'have','hawk','hazard','head','health','heart','heavy','hedgehog','height','hello',
  'helmet','help','hero','hidden','high','hill','hint','hip','hire','history',
  'hobby','hockey','hold','hole','hollow','home','honey','hood','hope','horn',
  'hospital','host','hour','hover','hub','huge','human','humble','humor','hundred',
  'hungry','hunt','hurdle','hurry','hurt','husband','hybrid','ice','icon','ignore',
  'ill','illegal','image','imitate','immense','immune','impact','impose','improve','impulse',
  'inbox','income','increase','index','indicate','indoor','industry','infant','inflict','inform',
  'inhale','inject','inner','innocent','input','inquiry','insane','insect','inspire','install',
  'intact','interest','into','invest','invite','involve','iron','island','isolate','issue',
  'item','ivory','jacket','jaguar','jar','jazz','jealous','jeans','jelly','jewel',
  'job','join','joke','journey','joy','judge','juice','jump','jungle','junior',
  'junk','just','kangaroo','keen','keep','ketchup','key','kick','kitten','kiwi',
  'knee','knife','knock','know','lab','lamp','language','laptop','large','later',
  'laugh','layer','lazy','leader','learn','leave','lecture','left','leg','legal',
  'legend','leisure','lemon','lend','length','lens','leopard','lesson','letter','level',
  'liar','liberty','library','license','life','lift','like','limb','limit','link',
  'lion','liquid','list','little','load','loan','lobster','local','lock','logic',
  'lonely','long','loop','lottery','loud','lounge','love','loyal','lucky','luggage',
  'lumber','lunar','lunch','luxury','mad','magic','magnet','maid','main','mammal',
  'mango','mansion','manual','maple','marble','march','margin','marine','market','marriage',
  'mask','master','match','material','math','matrix','matter','maximum','maze','meadow',
  'media','melody','melt','member','memory','mention','menu','mercy','merge','merit',
  'merry','mesh','message','metal','method','middle','midnight','milk','million','mimic',
  'mind','minimum','minor','miracle','miss','misery','mistake','mix','model','modify',
  'mom','monitor','monkey','monster','month','moon','moral','mother','motion','mountain',
  'mouse','move','movie','much','muffin','multiply','muscle','museum','mushroom','music',
  'must','mutual','myself','mystery','naive','nature','near','neck','need','negative',
  'neglect','neither','nephew','nerve','nest','network','neutral','never','news','next',
  'nice','night','noble','noise','nominee','noodle','normal','north','notable','note',
  'nothing','notice','novel','now','nuclear','number','nurse','nut','oak','obey',
  'object','oblige','obscure','obtain','ocean','october','odor','off','offer','office',
  'often','oil','okay','old','olympic','omit','once','onion','open','opera',
  'oppose','option','orange','orbit','orchard','order','ordinary','organ','orient','original',
  'orphan','ostrich','other','outdoor','outside','oval','over','own','oyster','ozone',
  'pact','paddle','page','pair','palace','palm','panda','panel','panic','panther',
  'paper','parade','parent','park','parrot','party','pass','patch','path','patrol',
  'pause','pave','payment','peace','peanut','peasant','pelican','penalty','pencil','people',
  'pepper','perfect','permit','person','pet','phone','photo','phrase','physical','piano',
  'picnic','picture','piece','pigeon','pilot','pink','pipe','pistol','pitch','pizza',
  'place','planet','plastic','plate','play','please','pledge','pluck','plug','plunge',
  'poem','poet','point','polar','pole','police','pond','pony','pool','popular',
  'portion','position','possible','post','potato','pottery','poverty','powder','power','practice',
  'praise','predict','prefer','prepare','present','pretty','prevent','price','pride','primary',
  'print','priority','prison','private','prize','problem','process','produce','profit','program',
  'project','promote','proof','property','prosper','protect','proud','provide','public','pudding',
  'pull','pulp','pulse','pumpkin','punch','pupil','puppy','purchase','purity','purpose',
  'push','put','puzzle','pyramid','quality','quantum','quarter','question','quick','quit',
  'quiz','quote','rabbit','raccoon','race','rack','radar','radio','rage','rally',
  'ramp','ranch','random','range','rapid','rare','rate','rather','raven','reach',
  'ready','real','reason','rebel','rebuild','recall','receive','recipe','record','recycle',
  'reduce','reflect','reform','refuse','region','regret','regular','reject','relax','release',
  'relief','rely','remain','remember','remind','remove','render','renew','rent','reopen',
  'repair','repeat','replace','report','require','rescue','resemble','resist','resource','response',
  'result','retire','retreat','return','reunion','reveal','review','reward','rhythm','ribbon',
  'rifle','right','rigid','ring','riot','ripple','risk','ritual','rival','river',
  'road','robot','robust','rocket','romance','roof','rookie','round','route','royal',
  'rubber','rude','rug','rule','run','runway','rural','sad','saddle','sadness',
  'safe','sail','salad','salmon','salon','salt','salute','same','sample','sand',
  'satisfy','satoshi','sauce','sausage','save','say','scale','scan','scatter','scene',
  'scheme','school','science','scissors','scorpion','scout','scrap','screen','script','scrub',
  'sea','search','season','seat','second','secret','section','security','seek','segment',
  'select','sell','seminar','senior','sense','sentence','series','service','session','settle',
  'setup','seven','shadow','shaft','shallow','share','shed','shell','sheriff','shield',
  'shift','shine','ship','shiver','shock','shoe','shoot','shop','short','shoulder',
  'shove','shrimp','shrug','shuffle','shy','sick','side','siege','sight','sign',
  'silent','silk','silly','silver','similar','simple','since','sing','siren','sister',
  'situate','six','size','ski','skill','skin','skirt','skull','slender','slice',
  'slide','slight','slim','slogan','slot','slow','slush','small','smart','smile',
  'smoke','smooth','snack','snake','snap','sniff','snow','soap','soccer','social',
  'sock','solar','soldier','solid','solution','solve','someone','song','soon','sorry',
  'sort','soul','sound','soup','source','south','space','spare','spatial','spawn',
  'speak','special','speed','sphere','spice','spider','spike','spin','spirit','split',
  'spoil','sponsor','spoon','spray','spread','spring','spy','square','squeeze','squirrel',
  'stable','stadium','staff','stage','stairs','stamp','stand','start','state','stay',
  'steak','steel','stem','step','stereo','stick','still','sting','stock','stomach',
  'stone','stop','store','storm','story','stove','strategy','street','strike','strong',
  'struggle','student','stuff','stumble','style','subject','submit','subway','success','such',
  'sudden','suffer','suggest','suit','summer','sun','sunny','sunset','super','supply',
  'supreme','sure','surface','surge','surprise','sustain','swallow','swamp','swap','swear',
  'sweet','swift','swim','swing','switch','sword','symbol','symptom','syrup','table',
  'tackle','tag','tail','talent','tank','tape','target','task','tattoo','taxi',
  'teach','team','tell','ten','tenant','tennis','tent','term','test','text',
  'thank','that','theme','then','theory','there','they','thing','this','thought',
  'three','thrive','throw','thumb','thunder','ticket','tilt','timber','time','tiny',
  'tip','tired','title','toast','tobacco','today','together','toilet','token','tomato',
  'tomorrow','tone','tongue','tonight','tool','topic','topple','torch','tornado','tortoise',
  'toss','total','tourist','toward','tower','town','toy','track','trade','traffic',
  'tragic','train','transfer','trap','trash','travel','tray','treat','tree','trend',
  'trial','trick','trigger','trim','trip','trophy','trouble','truck','truly','trumpet',
  'trust','truth','try','tube','tuition','tumble','tuna','tunnel','turkey','turn',
  'turtle','twelve','twenty','twice','twin','twist','two','type','typical','ugly',
  'umbrella','unable','unaware','uncle','uncover','under','undo','unfair','unfold','unhappy',
  'uniform','unique','universe','unknown','unlock','until','unusual','unveil','update','upgrade',
  'uphold','upon','upper','upset','urban','useful','useless','usual','utility','vacant',
  'vacuum','vague','valid','valley','valve','van','vanish','vapor','various','vast',
  'vault','vehicle','velvet','vendor','venture','venue','verb','version','very','veteran',
  'viable','vibrant','vicious','victory','video','view','village','vintage','violin','virtual',
  'virus','visa','visit','visual','vital','vivid','vocal','voice','void','volcano',
  'volume','vote','voyage','wage','wagon','wait','walk','wall','walnut','want',
  'warfare','warm','warrior','waste','water','wave','way','wealth','weapon','wear',
  'weasel','weather','web','wedding','weekend','weird','welcome','well','west','wet',
  'whale','wheat','wheel','when','where','whip','whisper','wide','width','wife',
  'wild','will','win','window','wine','wing','wink','winner','winter','wire',
  'wisdom','wish','witness','wolf','woman','wonder','wood','wool','word','world',
  'worry','worth','wrap','wreck','wrestle','wrist','write','wrong','yard','year',
  'yellow','you','young','youth','zebra','zero','zone','zoo'
];

// ── Generación de Frase Semilla BIP-39 (12 palabras, entropía criptográfica) ──
/**
 * Genera una frase semilla de 12 palabras usando crypto.getRandomValues.
 * @returns {string[]} Array de 12 palabras BIP-39
 */
export function generateSeedPhrase() {
  const wordlist = BIP39_MINI;
  const wordCount = wordlist.length;
  const indices = new Uint16Array(12);
  crypto.getRandomValues(indices);
  return Array.from(indices).map((i) => wordlist[i % wordCount]);
}

// ── Derivación Determinista de Dirección Pública ──────────────────────────────
/**
 * Deriva una dirección pública valens1q... a partir de una semilla o ID de usuario.
 * En producción se usaría secp256k1 + RIPEMD-160 + Bech32; aquí simulamos con un
 * hash simple (base36) para la Testnet L1.
 * @param {string|string[]} seedOrId - Frase semilla (array/string) o UUID de usuario
 * @returns {string} Dirección pública en formato valens1q...
 */
export function derivePublicAddress(seedOrId) {
  const input = Array.isArray(seedOrId) ? seedOrId.join(' ') : String(seedOrId || '');
  // Hash simple: suma de char codes, mezclada con longitud
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  const abs = Math.abs(hash);
  const segment1 = abs.toString(36).padStart(4, '0').slice(-4);
  const segment2 = (abs * 7 + input.length).toString(36).padStart(8, '0').slice(-8);
  const segment3 = ((abs ^ 0xdeadbeef) >>> 0).toString(36).padStart(8, '0').slice(-8);
  const segment4 = (abs * 13).toString(36).padStart(6, '0').slice(-6);
  return `${VALENS_PREFIX}${segment1}${segment2}${segment3}${segment4}`;
}

// ── QR URI: valens:<address>?amount=<integer> ─────────────────────────────────
/**
 * Genera el URI para código QR de ValensCoin.
 * @param {string} address - Dirección pública valens1q...
 * @param {number|null} amount - Monto entero opcional en VAL
 * @returns {string} URI en formato valens:<address>?amount=<n>
 */
export function generateValensQrUri(address, amount = null) {
  if (!address) return '';
  const baseUri = `valens:${address}`;
  if (amount !== null && amount !== undefined) {
    const intAmount = Math.floor(Number(amount));
    if (intAmount > 0) return `${baseUri}?amount=${intAmount}`;
  }
  return baseUri;
}

/**
 * Parsea un URI valens: y extrae dirección y monto.
 * @param {string} uri
 * @returns {{ address: string, amount: number|null }}
 */
export function parseValensQrUri(uri) {
  if (!uri || !uri.startsWith('valens:')) return { address: '', amount: null };
  const withoutScheme = uri.replace('valens:', '');
  const [addressPart, queryPart] = withoutScheme.split('?');
  let amount = null;
  if (queryPart) {
    const params = new URLSearchParams(queryPart);
    const raw = params.get('amount');
    if (raw !== null) amount = Math.floor(Number(raw));
  }
  return { address: addressPart, amount };
}

// ── Transferencia Local (fallback cuando Supabase no está configurado) ────────
/**
 * Realiza una transferencia simulada de VAL entre dos billeteras locales.
 * Registra en localStorage y devuelve el resultado.
 * @param {object} params
 * @param {string} params.fromAddress - Dirección del emisor
 * @param {string} params.toAddress - Dirección del receptor
 * @param {number} params.amount - Monto entero en VAL
 * @param {object} params.senderWallet - Objeto de billetera del emisor { balance_valens }
 * @returns {{ success: boolean, txHash?: string, newBalance?: number, error?: string }}
 */
export function localTransferTokens({ fromAddress, toAddress, amount, senderWallet }) {
  const intAmount = Math.floor(Number(amount));
  if (intAmount <= 0) return { success: false, error: 'El monto debe ser un entero mayor a 0.' };

  const currentBalance = Math.floor(Number(senderWallet?.balance_valens ?? 0));
  if (currentBalance < intAmount) {
    return { success: false, error: `Saldo insuficiente: tienes ${currentBalance} VAL.` };
  }

  const txHash = '0x' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const newBalance = currentBalance - intAmount;

  // Persistir en localStorage
  try {
    const txKey = 'gremami_local_txs';
    const stored = JSON.parse(localStorage.getItem(txKey) || '[]');
    stored.unshift({
      id: `tx-${Date.now()}`,
      tx_hash: txHash,
      sender_address: fromAddress,
      receiver_address: toAddress,
      amount: intAmount,
      type: 'transfer',
      status: 'confirmed',
      created_at: new Date().toISOString()
    });
    localStorage.setItem(txKey, JSON.stringify(stored.slice(0, 200)));
  } catch (e) {}

  return { success: true, txHash, newBalance, amount: intAmount };
}

/**
 * Aplica el grifo local: suma 5 VAL enteros.
 * @param {number} currentBalance
 * @returns {{ newBalance: number, txHash: string, amount: number }}
 */
export function localClaimFaucet(currentBalance) {
  const intBalance = Math.floor(Number(currentBalance ?? 0));
  const txHash = '0xfa' + Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

  try {
    const txKey = 'gremami_local_txs';
    const stored = JSON.parse(localStorage.getItem(txKey) || '[]');
    stored.unshift({
      id: `tx-faucet-${Date.now()}`,
      tx_hash: txHash,
      sender_address: 'valens_faucet',
      receiver_address: 'self',
      amount: FAUCET_AMOUNT,
      type: 'faucet',
      status: 'confirmed',
      created_at: new Date().toISOString()
    });
    localStorage.setItem(txKey, JSON.stringify(stored.slice(0, 200)));
  } catch (e) {}

  return { newBalance: intBalance + FAUCET_AMOUNT, txHash, amount: FAUCET_AMOUNT };
}

export default {
  TOTAL_SUPPLY,
  DECIMALS,
  FAUCET_AMOUNT,
  AIRDROP_AMOUNT,
  VALENS_PREFIX,
  generateSeedPhrase,
  derivePublicAddress,
  generateValensQrUri,
  parseValensQrUri,
  localTransferTokens,
  localClaimFaucet
};

const MODULES = [
  {
    "id": "greetings",
    "title": "Greetings & Courtesy",
    "icon": "👋",
    "description": "Natural greetings, polite responses, thanks, and leave-taking before any grammar-heavy work.",
    "unlockAt": 0
  },
  {
    "id": "introductions",
    "title": "Names & Introductions",
    "icon": "🙂",
    "description": "Say who you are, ask someone’s name, and respond naturally without forcing formal textbook phrases.",
    "unlockAt": 10
  },
  {
    "id": "origin",
    "title": "Origin & Home",
    "icon": "🌏",
    "description": "Ask where someone is from, where they live now, and explain that you are learning Tagalog.",
    "unlockAt": 28
  },
  {
    "id": "wellbeing",
    "title": "How You Feel",
    "icon": "💛",
    "description": "Talk about being well, tired, hungry, thirsty, happy, or only partly okay.",
    "unlockAt": 50
  },
  {
    "id": "questions",
    "title": "Questions & Help",
    "icon": "❓",
    "description": "Find places, ask meanings, request repetition, and survive a conversation when you do not understand.",
    "unlockAt": 76
  },
  {
    "id": "food",
    "title": "Food & Everyday Wants",
    "icon": "🍲",
    "description": "Express wants and needs, answer Kumain ka na?, order simply, and ask about payment.",
    "unlockAt": 108
  },
  {
    "id": "grammar",
    "title": "People, Place & Particles",
    "icon": "🧩",
    "description": "Build the sentence system: pronouns, demonstratives, location words, and high-frequency particles.",
    "unlockAt": 148
  },
  {
    "id": "verbs",
    "title": "Verb Engine",
    "icon": "⚙️",
    "description": "High-value roots introduced one aspect at a time after the conversational base is stable.",
    "unlockAt": 205
  },
  {
    "id": "spanish",
    "title": "Spanish Connections",
    "icon": "🟠",
    "description": "Recognise integrated Spanish-origin words that Filipinos use as ordinary Filipino vocabulary.",
    "unlockAt": 265
  },
  {
    "id": "taglish",
    "title": "Natural Taglish",
    "icon": "🔀",
    "description": "Use familiar English roots inside Tagalog grammar, particles, and sentence order.",
    "unlockAt": 305
  }
];

const MODULE_META = {
  greetings:     {region:"Welcome Bay",          x:16, y:86, terrain:"coast"},
  introductions: {region:"Name Village",         x:36, y:78, terrain:"village"},
  origin:        {region:"Home Hills",           x:61, y:75, terrain:"hills"},
  wellbeing:     {region:"Feeling Forest",       x:80, y:64, terrain:"forest"},
  questions:     {region:"Question Crossroads", x:63, y:52, terrain:"roads"},
  food:          {region:"Market Port",          x:39, y:57, terrain:"market"},
  grammar:       {region:"Grammar Bridge",       x:20, y:45, terrain:"bridge"},
  verbs:         {region:"Verb Volcano",         x:38, y:31, terrain:"volcano"},
  spanish:       {region:"Spanish Square",       x:62, y:26, terrain:"square"},
  taglish:       {region:"Taglish City",         x:82, y:14, terrain:"city"}
};

const ITEMS = [
  {"id":"g_kumusta","module":"greetings","kind":"phrase","skill":"conversation","term":"Kumusta!","meaning":"Hello! / How is it going?","origin":"Spanish","example":"Kumusta!","natural":"Hello! / How is it going?","hint":"In casual Filipino, English “hello” is also common. Kumusta is the high-value Filipino greeting to learn.","analysis":{"tokens":[["Kumusta","how-are-things / hello"]],"literal":"How-are-things!"}},
  {"id":"g_umaga","module":"greetings","kind":"phrase","skill":"conversation","term":"Magandang umaga po","meaning":"Good morning (respectfully)","origin":"native","example":"Magandang umaga po.","natural":"Good morning.","hint":"Magandang contains maganda plus the linker -ng. Po adds respect.","analysis":{"tokens":[["Maganda-ng","beautiful-LINK"],["umaga","morning"],["po","respect"]],"literal":"Beautiful morning, respectfully."}},
  {"id":"g_kumusta_ka","module":"greetings","kind":"phrase","skill":"conversation","term":"Kumusta ka?","meaning":"How are you?","origin":"Spanish","example":"Kumusta ka?","natural":"How are you?","hint":"Ka is the short subject form of “you” after the predicate.","analysis":{"tokens":[["Kumusta","how-are-things"],["ka","you"]],"literal":"How-are-things you?"}},
  {"id":"g_mabuti","module":"greetings","kind":"phrase","skill":"conversation","term":"Mabuti naman","meaning":"I’m well / Fine, thanks","origin":"native","example":"Mabuti naman.","natural":"I’m well, thanks.","hint":"Naman often makes the reply feel reciprocal or conversational; it does not map neatly to one English word.","analysis":{"tokens":[["Mabuti","well / good"],["naman","in-turn / softener"]],"literal":"Well, in turn."}},
  {"id":"g_salamat","module":"greetings","kind":"phrase","skill":"conversation","term":"Salamat po","meaning":"Thank you (respectfully)","origin":"native","example":"Salamat po.","natural":"Thank you.","hint":"Use po with older people, strangers, or anyone you wish to address respectfully.","analysis":{"tokens":[["Salamat","thanks"],["po","respect"]],"literal":"Thanks, respectfully."}},
  {"id":"g_oo","module":"greetings","kind":"phrase","skill":"conversation","term":"Oo","meaning":"Yes","origin":"native","example":"Oo.","natural":"Yes.","hint":"Opo is the respectful equivalent.","analysis":{"tokens":[["Oo","yes"]],"literal":"Yes."}},
  {"id":"g_opo","module":"greetings","kind":"phrase","skill":"conversation","term":"Opo","meaning":"Yes (respectfully)","origin":"native","example":"Opo.","natural":"Yes.","hint":"Opo combines an affirmative response with respect.","analysis":{"tokens":[["Opo","yes + respect"]],"literal":"Yes-respectfully."}},
  {"id":"g_hindi_po","module":"greetings","kind":"phrase","skill":"conversation","term":"Hindi po","meaning":"No / Not (respectfully)","origin":"native","example":"Hindi po.","natural":"No.","hint":"Hindi means no or not; po softens and respects.","analysis":{"tokens":[["Hindi","no / not"],["po","respect"]],"literal":"No, respectfully."}},
  {"id":"g_hapon","module":"greetings","kind":"phrase","skill":"conversation","term":"Magandang hapon","meaning":"Good afternoon","origin":"native","example":"Magandang hapon.","natural":"Good afternoon.","hint":"The same maganda + linker pattern used in other time greetings.","analysis":{"tokens":[["Maganda-ng","beautiful-LINK"],["hapon","afternoon"]],"literal":"Beautiful afternoon."}},
  {"id":"g_gabi","module":"greetings","kind":"phrase","skill":"conversation","term":"Magandang gabi","meaning":"Good evening","origin":"native","example":"Magandang gabi.","natural":"Good evening.","hint":"Gabi means evening or night.","analysis":{"tokens":[["Maganda-ng","beautiful-LINK"],["gabi","evening / night"]],"literal":"Beautiful evening."}},
  {"id":"g_walang_anuman","module":"greetings","kind":"phrase","skill":"conversation","term":"Walang anuman","meaning":"You’re welcome / It’s nothing","origin":"native","example":"Walang anuman.","natural":"You’re welcome.","hint":"Literally, there is nothing to it.","analysis":{"tokens":[["Wala-ng","none + linker"],["anuman","anything / whatever"]],"literal":"Nothing whatever."}},
  {"id":"g_sige","module":"greetings","kind":"phrase","skill":"conversation","term":"Sige","meaning":"Okay / All right / Go ahead","origin":"Spanish","example":"Sige.","natural":"Okay.","hint":"Extremely common, with meaning shaped by context.","analysis":{"tokens":[["Sige","okay / go-ahead"]],"literal":"Okay."}},
  {"id":"g_ingat","module":"greetings","kind":"phrase","skill":"conversation","term":"Ingat!","meaning":"Take care!","origin":"native","example":"Sige, ingat!","natural":"Okay, take care!","hint":"A more natural everyday leave-taking than the formal paalam in many casual settings.","analysis":{"tokens":[["Sige","okay"],["ingat","care / caution"]],"literal":"Okay, care!"}},
  {"id":"g_ikaw_rin","module":"greetings","kind":"phrase","skill":"conversation","term":"Ikaw rin","meaning":"You too","origin":"native","example":"Ikaw rin.","natural":"You too.","hint":"Rin means also/too and commonly follows a vowel.","analysis":{"tokens":[["Ikaw","you"],["rin","also / too"]],"literal":"You also."}},
  {"id":"i_ako_si","module":"introductions","kind":"pattern","skill":"conversation","term":"Ako si ___","meaning":"I am ___ (name)","origin":"native","example":"Ako si Alex.","natural":"I’m Alex.","hint":"Si marks a personal name. There is no separate word for “am.”","analysis":{"tokens":[["Ako","I"],["si","personal-name marker"],["Alex","Alex"]],"literal":"I [name-marker] Alex."}},
  {"id":"i_name_q","module":"introductions","kind":"phrase","skill":"conversation","term":"Anong pangalan mo?","meaning":"What is your name?","origin":"Spanish","example":"Anong pangalan mo?","natural":"What’s your name?","hint":"Anong is ano plus the linker -ng. Pangalan is Spanish-origin but fully integrated.","analysis":{"tokens":[["Ano-ng","what-LINK"],["pangalan","name"],["mo","your"]],"literal":"What name your?"}},
  {"id":"i_name_a","module":"introductions","kind":"phrase","skill":"conversation","term":"Mia ang pangalan ko","meaning":"My name is Mia","origin":"Spanish","example":"Mia ang pangalan ko.","natural":"My name is Mia.","hint":"The name is placed first as the predicate; pangalan ko means my name.","analysis":{"tokens":[["Mia","Mia"],["ang","subject marker"],["pangalan","name"],["ko","my"]],"literal":"Mia [SUBJ] name my."}},
  {"id":"i_ikaw","module":"introductions","kind":"phrase","skill":"conversation","term":"Ikaw?","meaning":"And you?","origin":"native","example":"Ikaw?","natural":"And you?","hint":"A complete conversational follow-up with context.","analysis":{"tokens":[["Ikaw","you"]],"literal":"You?"}},
  {"id":"i_sino_ka","module":"introductions","kind":"phrase","skill":"conversation","term":"Sino ka?","meaning":"Who are you?","origin":"native","example":"Sino ka?","natural":"Who are you?","hint":"Useful, but can sound direct without a friendly context.","analysis":{"tokens":[["Sino","who"],["ka","you"]],"literal":"Who you?"}},
  {"id":"i_ito_si","module":"introductions","kind":"pattern","skill":"conversation","term":"Ito si ___","meaning":"This is ___ (a person)","origin":"native","example":"Ito si Ana.","natural":"This is Ana.","hint":"Ito is this; si marks a personal name.","analysis":{"tokens":[["Ito","this"],["si","personal-name marker"],["Ana","Ana"]],"literal":"This [name-marker] Ana."}},
  {"id":"i_kaibigan","module":"introductions","kind":"phrase","skill":"conversation","term":"Kaibigan ko siya","meaning":"He / She is my friend","origin":"native","example":"Kaibigan ko siya.","natural":"She is my friend.","hint":"Tagalog siya does not encode gender.","analysis":{"tokens":[["Kaibigan","friend"],["ko","my"],["siya","he / she"]],"literal":"Friend my he/she."}},
  {"id":"i_trabaho_q","module":"introductions","kind":"phrase","skill":"conversation","term":"Anong trabaho mo?","meaning":"What is your job?","origin":"Spanish","example":"Anong trabaho mo?","natural":"What do you do for work?","hint":"Trabaho is a common Spanish-origin word.","analysis":{"tokens":[["Ano-ng","what-LINK"],["trabaho","work / job"],["mo","your"]],"literal":"What job your?"}},
  {"id":"i_scientist","module":"introductions","kind":"pattern","skill":"conversation","term":"Data scientist ako","meaning":"I am a data scientist","origin":"Mixed","example":"Data scientist ako.","natural":"I’m a data scientist.","hint":"The occupation may remain English; Tagalog predicate-first order remains.","analysis":{"tokens":[["Data scientist","data scientist"],["ako","I"]],"literal":"Data scientist I."}},
  {"id":"i_nice_note","module":"introductions","kind":"phrase","skill":"conversation","term":"Masaya akong makilala ka","meaning":"I’m happy to meet you","origin":"native","example":"Masaya akong makilala ka.","natural":"Nice to meet you.","hint":"This is understandable, but many Filipinos simply say “Nice to meet you” in English in casual Taglish.","analysis":{"tokens":[["Masaya","happy"],["ako-ng","I-LINK"],["makilala","to-get-to-know / meet"],["ka","you"]],"literal":"Happy I to-meet you."}},
  {"id":"o_taga_saan","module":"origin","kind":"phrase","skill":"conversation","term":"Taga-saan ka?","meaning":"Where are you from?","origin":"native","example":"Taga-saan ka?","natural":"Where are you from?","hint":"Taga- marks origin or association with a place.","analysis":{"tokens":[["Taga-saan","from-where"],["ka","you"]],"literal":"From-where you?"}},
  {"id":"o_taga_place","module":"origin","kind":"pattern","skill":"conversation","term":"Taga-___ ako","meaning":"I am from ___","origin":"native","example":"Taga-England ako.","natural":"I’m from England.","hint":"Attach taga- to the place name, then place ako after the predicate.","analysis":{"tokens":[["Taga-England","from-England"],["ako","I"]],"literal":"From-England I."}},
  {"id":"o_saan_live","module":"origin","kind":"phrase","skill":"conversation","term":"Saan ka nakatira?","meaning":"Where do you live?","origin":"native","example":"Saan ka nakatira?","natural":"Where do you live?","hint":"Nakatira describes residing or living somewhere.","analysis":{"tokens":[["Saan","where"],["ka","you"],["nakatira","residing"]],"literal":"Where you residing?"}},
  {"id":"o_live_place","module":"origin","kind":"pattern","skill":"conversation","term":"Nakatira ako sa ___","meaning":"I live in ___","origin":"native","example":"Nakatira ako sa Marikina.","natural":"I live in Marikina.","hint":"The location follows sa.","analysis":{"tokens":[["Nakatira","residing"],["ako","I"],["sa","in / at"],["Marikina","Marikina"]],"literal":"Residing I in Marikina."}},
  {"id":"o_ngayon","module":"origin","kind":"word","skill":"vocabulary","term":"ngayon","meaning":"now","origin":"native","example":"Saan ka nakatira ngayon?","natural":"Where do you live now?","hint":"A common time expression.","analysis":{"tokens":[["Saan","where"],["ka","you"],["nakatira","residing"],["ngayon","now"]],"literal":"Where you residing now?"}},
  {"id":"o_study","module":"origin","kind":"phrase","skill":"conversation","term":"Nag-aaral ako ng Tagalog","meaning":"I am studying Tagalog","origin":"native","example":"Nag-aaral ako ng Tagalog.","natural":"I’m studying Tagalog.","hint":"Nag-aaral is an ongoing actor-focused form of aral, study/learn.","analysis":{"tokens":[["Nag-aaral","studying"],["ako","I"],["ng","object marker"],["Tagalog","Tagalog"]],"literal":"Studying I [OBJ] Tagalog."}},
  {"id":"o_still_study","module":"origin","kind":"phrase","skill":"conversation","term":"Nag-aaral pa ako","meaning":"I am still studying","origin":"native","example":"Nag-aaral pa ako.","natural":"I’m still learning.","hint":"Pa contributes still/yet.","analysis":{"tokens":[["Nag-aaral","studying"],["pa","still"],["ako","I"]],"literal":"Studying still I."}},
  {"id":"o_little","module":"origin","kind":"phrase","skill":"conversation","term":"Kaunti lang","meaning":"Only a little","origin":"native","example":"Kaunti lang.","natural":"Only a little.","hint":"Lang means only/just.","analysis":{"tokens":[["Kaunti","a-little"],["lang","only"]],"literal":"A-little only."}},
  {"id":"o_not_yet_speak","module":"origin","kind":"phrase","skill":"conversation","term":"Hindi pa ako marunong mag-Tagalog","meaning":"I cannot speak Tagalog yet","origin":"Mixed","example":"Hindi pa ako marunong mag-Tagalog.","natural":"I can’t speak Tagalog yet.","hint":"Marunong means knowing how; pa makes the limitation temporary: not yet.","analysis":{"tokens":[["Hindi","not"],["pa","yet"],["ako","I"],["marunong","know-how"],["mag-Tagalog","speak/use-Tagalog"]],"literal":"Not yet I know-how to-Tagalog."}},
  {"id":"o_here_long","module":"origin","kind":"phrase","skill":"conversation","term":"Matagal ka na ba dito?","meaning":"Have you been here long?","origin":"native","example":"Matagal ka na ba dito?","natural":"Have you been here long?","hint":"Na signals that a state has already begun; ba marks the question.","analysis":{"tokens":[["Matagal","long-time"],["ka","you"],["na","already"],["ba","question"],["dito","here"]],"literal":"Long-time you already Q here?"}},
  {"id":"w_okay","module":"wellbeing","kind":"phrase","skill":"conversation","term":"Okay lang","meaning":"I’m okay / It’s okay","origin":"Mixed","example":"Okay lang.","natural":"I’m okay.","hint":"The English word remains, but lang gives the natural Filipino meaning “just okay.”","analysis":{"tokens":[["Okay","okay"],["lang","just / only"]],"literal":"Okay just."}},
  {"id":"w_ayos","module":"wellbeing","kind":"phrase","skill":"conversation","term":"Ayos lang","meaning":"I’m fine / It’s fine","origin":"Spanish","example":"Ayos lang.","natural":"I’m fine.","hint":"Ayos is Spanish-origin and highly integrated.","analysis":{"tokens":[["Ayos","fine / in-order"],["lang","just"]],"literal":"Fine just."}},
  {"id":"w_pagod","module":"wellbeing","kind":"phrase","skill":"conversation","term":"Pagod ako","meaning":"I am tired","origin":"native","example":"Pagod ako.","natural":"I’m tired.","hint":"The predicate pagod comes before the subject ako.","analysis":{"tokens":[["Pagod","tired"],["ako","I"]],"literal":"Tired I."}},
  {"id":"w_medyo","module":"wellbeing","kind":"phrase","skill":"conversation","term":"Medyo pagod ako","meaning":"I am a little tired","origin":"Spanish","example":"Medyo pagod ako.","natural":"I’m a little tired.","hint":"Medyo softens the statement: somewhat/a little.","analysis":{"tokens":[["Medyo","somewhat"],["pagod","tired"],["ako","I"]],"literal":"Somewhat tired I."}},
  {"id":"w_gutom","module":"wellbeing","kind":"phrase","skill":"conversation","term":"Gutom ako","meaning":"I am hungry","origin":"native","example":"Gutom ako.","natural":"I’m hungry.","hint":"Predicate first: hungry I.","analysis":{"tokens":[["Gutom","hungry"],["ako","I"]],"literal":"Hungry I."}},
  {"id":"w_uhaw","module":"wellbeing","kind":"phrase","skill":"conversation","term":"Uhaw ako","meaning":"I am thirsty","origin":"native","example":"Uhaw ako.","natural":"I’m thirsty.","hint":"Predicate first: thirsty I.","analysis":{"tokens":[["Uhaw","thirsty"],["ako","I"]],"literal":"Thirsty I."}},
  {"id":"w_masaya","module":"wellbeing","kind":"phrase","skill":"conversation","term":"Masaya ako","meaning":"I am happy","origin":"native","example":"Masaya ako.","natural":"I’m happy.","hint":"Masaya precedes ako.","analysis":{"tokens":[["Masaya","happy"],["ako","I"]],"literal":"Happy I."}},
  {"id":"w_hindi_masyado","module":"wellbeing","kind":"phrase","skill":"conversation","term":"Hindi masyado","meaning":"Not very / Not really","origin":"Spanish","example":"Hindi masyado.","natural":"Not really.","hint":"Useful when a yes/no answer is too strong.","analysis":{"tokens":[["Hindi","not"],["masyado","too-much / very"]],"literal":"Not too-much."}},
  {"id":"w_ikaw_naman","module":"wellbeing","kind":"phrase","skill":"conversation","term":"Ikaw naman?","meaning":"How about you?","origin":"native","example":"Ikaw naman?","natural":"How about you?","hint":"Naman shifts the conversational turn or contrast.","analysis":{"tokens":[["Ikaw","you"],["naman","in-turn / contrast"]],"literal":"You in-turn?"}},
  {"id":"w_mabuti_na","module":"wellbeing","kind":"phrase","skill":"conversation","term":"Mabuti na","meaning":"Better now / It is okay now","origin":"native","example":"Mabuti na.","natural":"I’m better now.","hint":"Na can mark a new or completed state.","analysis":{"tokens":[["Mabuti","well / good"],["na","now / already"]],"literal":"Well now."}},
  {"id":"q_ano_ito","module":"questions","kind":"phrase","skill":"conversation","term":"Ano ito?","meaning":"What is this?","origin":"native","example":"Ano ito?","natural":"What is this?","hint":"Tagalog does not need a separate “is” here.","analysis":{"tokens":[["Ano","what"],["ito","this"]],"literal":"What this?"}},
  {"id":"q_sino_siya","module":"questions","kind":"phrase","skill":"conversation","term":"Sino siya?","meaning":"Who is he / she?","origin":"native","example":"Sino siya?","natural":"Who is she?","hint":"Siya does not encode gender.","analysis":{"tokens":[["Sino","who"],["siya","he / she"]],"literal":"Who he/she?"}},
  {"id":"q_banyo","module":"questions","kind":"phrase","skill":"conversation","term":"Nasaan ang banyo?","meaning":"Where is the bathroom?","origin":"Spanish","example":"Nasaan ang banyo?","natural":"Where’s the bathroom?","hint":"Nasaan asks where something is located.","analysis":{"tokens":[["Nasaan","where-located"],["ang","subject marker"],["banyo","bathroom"]],"literal":"Where-located [SUBJ] bathroom?"}},
  {"id":"q_magkano","module":"questions","kind":"phrase","skill":"conversation","term":"Magkano ito?","meaning":"How much is this?","origin":"native","example":"Magkano ito?","natural":"How much is this?","hint":"No separate “is” is required.","analysis":{"tokens":[["Magkano","how-much"],["ito","this"]],"literal":"How-much this?"}},
  {"id":"q_puwede","module":"questions","kind":"phrase","skill":"conversation","term":"Puwede ba?","meaning":"Is it possible? / May I?","origin":"Spanish","example":"Puwede ba?","natural":"May I?","hint":"Ba marks a yes/no question.","analysis":{"tokens":[["Puwede","possible / allowed"],["ba","question"]],"literal":"Allowed Q?"}},
  {"id":"q_pakiulit","module":"questions","kind":"phrase","skill":"conversation","term":"Pakiulit po","meaning":"Please repeat","origin":"native","example":"Pakiulit po.","natural":"Please repeat that.","hint":"Paki- turns the root ulit, repeat, into a polite request.","analysis":{"tokens":[["Paki-ulit","please-repeat"],["po","respect"]],"literal":"Please-repeat, respectfully."}},
  {"id":"q_slow","module":"questions","kind":"phrase","skill":"conversation","term":"Dahan-dahan lang","meaning":"Slowly, please / Just slowly","origin":"native","example":"Dahan-dahan lang.","natural":"Please speak slowly.","hint":"Dahan-dahan is reduplicated to mean slowly; lang softens it.","analysis":{"tokens":[["Dahan-dahan","slowly"],["lang","just"]],"literal":"Slowly just."}},
  {"id":"q_dont_understand","module":"questions","kind":"phrase","skill":"conversation","term":"Hindi ko naiintindihan","meaning":"I do not understand","origin":"native","example":"Hindi ko naiintindihan.","natural":"I don’t understand.","hint":"Ko marks the experiencer in this construction; the English order is different.","analysis":{"tokens":[["Hindi","not"],["ko","by-me / I"],["naiintindihan","understood"]],"literal":"Not by-me understood."}},
  {"id":"q_meaning","module":"questions","kind":"pattern","skill":"conversation","term":"Anong ibig sabihin ng ___?","meaning":"What does ___ mean?","origin":"native","example":"Anong ibig sabihin ng salamat?","natural":"What does salamat mean?","hint":"Ibig sabihin is a fixed expression meaning “meaning” or “to mean.”","analysis":{"tokens":[["Ano-ng","what-LINK"],["ibig sabihin","intended meaning"],["ng","of / marker"],["salamat","salamat"]],"literal":"What intended-meaning of salamat?"}},
  {"id":"q_how_say","module":"questions","kind":"pattern","skill":"conversation","term":"Paano sabihin sa Tagalog ang ___?","meaning":"How do you say ___ in Tagalog?","origin":"native","example":"Paano sabihin sa Tagalog ang water?","natural":"How do you say “water” in Tagalog?","hint":"The item being translated is marked by ang.","analysis":{"tokens":[["Paano","how"],["sabihin","say"],["sa","in"],["Tagalog","Tagalog"],["ang","subject marker"],["water","water"]],"literal":"How say in Tagalog [SUBJ] water?"}},
  {"id":"q_sandali","module":"questions","kind":"phrase","skill":"conversation","term":"Sandali lang","meaning":"Just a moment","origin":"native","example":"Sandali lang.","natural":"Just a moment.","hint":"Lang limits or softens the request.","analysis":{"tokens":[["Sandali","moment"],["lang","just"]],"literal":"Moment just."}},
  {"id":"q_help","module":"questions","kind":"phrase","skill":"conversation","term":"Patulong po","meaning":"Please help me","origin":"native","example":"Patulong po.","natural":"Could you help me, please?","hint":"A compact polite request for assistance.","analysis":{"tokens":[["Pa-tulong","request-help"],["po","respect"]],"literal":"Request-help, respectfully."}},
  {"id":"q_where","module":"questions","kind":"word","skill":"vocabulary","term":"Saan?","meaning":"Where?","origin":"native","example":"Saan?","natural":"Where?","hint":"Used for destination or general location; nasaan asks where something is located.","analysis":{"tokens":[["Saan","where"]],"literal":"Where?"}},
  {"id":"q_why","module":"questions","kind":"word","skill":"vocabulary","term":"Bakit?","meaning":"Why?","origin":"native","example":"Bakit?","natural":"Why?","hint":"A high-frequency question word.","analysis":{"tokens":[["Bakit","why"]],"literal":"Why?"}},
  {"id":"q_when","module":"questions","kind":"word","skill":"vocabulary","term":"Kailan?","meaning":"When?","origin":"native","example":"Kailan?","natural":"When?","hint":"A high-frequency question word.","analysis":{"tokens":[["Kailan","when"]],"literal":"When?"}},
  {"id":"f_gusto","module":"food","kind":"pattern","skill":"conversation","term":"Gusto ko ng ___","meaning":"I want / like ___","origin":"Spanish","example":"Gusto ko ng tubig.","natural":"I want water.","hint":"Gusto comes first; ko marks the experiencer; ng marks an indefinite object.","analysis":{"tokens":[["Gusto","want / like"],["ko","I / by-me"],["ng","object marker"],["tubig","water"]],"literal":"Want I [OBJ] water."}},
  {"id":"f_ayaw","module":"food","kind":"pattern","skill":"conversation","term":"Ayaw ko ng ___","meaning":"I do not want / dislike ___","origin":"native","example":"Ayaw ko ng kape.","natural":"I don’t want coffee.","hint":"Ayaw is the practical negative counterpart of gusto.","analysis":{"tokens":[["Ayaw","do-not-want"],["ko","I / by-me"],["ng","object marker"],["kape","coffee"]],"literal":"Do-not-want I [OBJ] coffee."}},
  {"id":"f_need","module":"food","kind":"pattern","skill":"conversation","term":"Kailangan ko ng ___","meaning":"I need ___","origin":"native","example":"Kailangan ko ng tubig.","natural":"I need water.","hint":"The needed thing follows ng.","analysis":{"tokens":[["Kailangan","need / necessary"],["ko","I / by-me"],["ng","object marker"],["tubig","water"]],"literal":"Need I [OBJ] water."}},
  {"id":"f_have_water","module":"food","kind":"phrase","skill":"conversation","term":"May tubig ba?","meaning":"Is there water? / Do you have water?","origin":"native","example":"May tubig ba?","natural":"Is there any water?","hint":"May introduces existence or possession; ba makes the question.","analysis":{"tokens":[["May","there-is / have"],["tubig","water"],["ba","question"]],"literal":"There-is water Q?"}},
  {"id":"f_water_only","module":"food","kind":"phrase","skill":"conversation","term":"Tubig lang","meaning":"Just water","origin":"native","example":"Tubig lang.","natural":"Just water.","hint":"Lang means only/just.","analysis":{"tokens":[["Tubig","water"],["lang","only"]],"literal":"Water only."}},
  {"id":"f_delicious","module":"food","kind":"phrase","skill":"conversation","term":"Masarap!","meaning":"Delicious!","origin":"native","example":"Masarap!","natural":"Delicious!","hint":"Often used without a subject when the food is obvious.","analysis":{"tokens":[["Masarap","delicious"]],"literal":"Delicious!"}},
  {"id":"f_eaten","module":"food","kind":"phrase","skill":"conversation","term":"Kumain ka na?","meaning":"Have you eaten?","origin":"native","example":"Kumain ka na?","natural":"Have you eaten?","hint":"A very common caring question; na means already/by now.","analysis":{"tokens":[["Kumain","ate"],["ka","you"],["na","already"]],"literal":"Ate you already?"}},
  {"id":"f_not_yet","module":"food","kind":"phrase","skill":"conversation","term":"Hindi pa","meaning":"Not yet","origin":"native","example":"Hindi pa.","natural":"Not yet.","hint":"Pa contrasts with na: still/yet versus already.","analysis":{"tokens":[["Hindi","not"],["pa","yet"]],"literal":"Not yet."}},
  {"id":"f_ate_already","module":"food","kind":"phrase","skill":"conversation","term":"Kumain na ako","meaning":"I have eaten already","origin":"native","example":"Kumain na ako.","natural":"I’ve already eaten.","hint":"Predicate first: ate already I.","analysis":{"tokens":[["Kumain","ate"],["na","already"],["ako","I"]],"literal":"Ate already I."}},
  {"id":"f_one_more","module":"food","kind":"phrase","skill":"conversation","term":"Isa pa","meaning":"One more","origin":"native","example":"Isa pa.","natural":"One more.","hint":"Pa can also mean more/additional.","analysis":{"tokens":[["Isa","one"],["pa","more"]],"literal":"One more."}},
  {"id":"f_enough","module":"food","kind":"phrase","skill":"conversation","term":"Tama na","meaning":"That is enough / Stop now","origin":"native","example":"Tama na.","natural":"That’s enough.","hint":"Na marks that the sufficient point has now been reached.","analysis":{"tokens":[["Tama","enough / correct"],["na","now / already"]],"literal":"Enough now."}},
  {"id":"f_pass","module":"food","kind":"phrase","skill":"conversation","term":"Paki-abot po","meaning":"Please pass it","origin":"native","example":"Paki-abot po.","natural":"Please pass it.","hint":"Paki- creates a polite request from abot, reach/hand over.","analysis":{"tokens":[["Paki-abot","please-hand-over"],["po","respect"]],"literal":"Please-hand-over, respectfully."}},
  {"id":"f_total","module":"food","kind":"phrase","skill":"conversation","term":"Magkano lahat?","meaning":"How much is everything?","origin":"native","example":"Magkano lahat?","natural":"How much is everything?","hint":"Lahat means all/everything.","analysis":{"tokens":[["Magkano","how-much"],["lahat","all"]],"literal":"How-much all?"}},
  {"id":"f_payment","module":"food","kind":"phrase","skill":"conversation","term":"Bayad po","meaning":"Payment, please / Here is my payment","origin":"native","example":"Bayad po.","natural":"Here’s my payment.","hint":"A common compact phrase in transport or small transactions.","analysis":{"tokens":[["Bayad","payment"],["po","respect"]],"literal":"Payment, respectfully."}},
  {"id":"f_sige_one","module":"food","kind":"phrase","skill":"conversation","term":"Sige, isa lang","meaning":"Okay, just one","origin":"Mixed","example":"Sige, isa lang.","natural":"Okay, just one.","hint":"Sige accepts; lang limits the quantity.","analysis":{"tokens":[["Sige","okay"],["isa","one"],["lang","only"]],"literal":"Okay, one only."}},

  // Extended foundations and connectors
  {id:"hindi",module:"questions",kind:"word",skill:"vocabulary",term:"hindi",meaning:"not / no",origin:"native",example:"Hindi ako pagod.",natural:"I am not tired.",hint:"Used before a predicate to negate it."},
  {id:"wala",module:"questions",kind:"word",skill:"vocabulary",term:"wala",meaning:"none / absent / do not have",origin:"native",example:"Wala akong pera.",natural:"I do not have money.",hint:"Expresses absence or non-possession."},
  {id:"mayroon",module:"questions",kind:"word",skill:"vocabulary",term:"mayroon",meaning:"there is / have",origin:"native",example:"Mayroon akong oras.",natural:"I have time.",hint:"Often shortened to may before a noun."},
  {id:"gusto",module:"questions",kind:"word",skill:"vocabulary",term:"gusto",meaning:"want / like",origin:"Spanish",example:"Gusto ko ng kape.",natural:"I want coffee.",hint:"Usually followed by a pronoun such as ko."},
  {id:"ayaw",module:"questions",kind:"word",skill:"vocabulary",term:"ayaw",meaning:"do not want / dislike",origin:"native",example:"Ayaw ko muna.",natural:"I do not want to yet.",hint:"The negative counterpart of gusto."},
  {id:"kailangan",module:"questions",kind:"word",skill:"vocabulary",term:"kailangan",meaning:"need / necessary",origin:"native",example:"Kailangan ko ng tulong.",natural:"I need help.",hint:"Can mean either need or necessary."},
  {id:"puwede",module:"questions",kind:"word",skill:"vocabulary",term:"puwede",meaning:"can / allowed / possible",origin:"Spanish",example:"Puwede ba ako dito?",natural:"Can I be here?",hint:"Also spelled pwede in informal writing."},
  {id:"alam",module:"questions",kind:"word",skill:"vocabulary",term:"alam",meaning:"know",origin:"native",example:"Alam ko.",natural:"I know.",hint:"A common stative predicate."},
  {id:"sabi",module:"questions",kind:"word",skill:"vocabulary",term:"sabi",meaning:"said / what someone says",origin:"native",example:"Sabi niya, bukas daw.",natural:"They said it is tomorrow.",hint:"Very common in reported speech."},
  {id:"tingin",module:"questions",kind:"word",skill:"vocabulary",term:"tingin",meaning:"look / view / opinion",origin:"native",example:"Sa tingin ko, tama.",natural:"I think it is correct.",hint:"Sa tingin ko means in my view."},
  {id:"kasi",module:"questions",kind:"word",skill:"grammar",term:"kasi",meaning:"because",origin:"native",example:"Hindi ako pupunta kasi pagod ako.",natural:"I will not go because I am tired.",hint:"Commonly gives a reason after the main statement."},
  {id:"kaya",module:"questions",kind:"word",skill:"grammar",term:"kaya",meaning:"therefore / so; able",origin:"native",example:"Pagod ako, kaya uuwi ako.",natural:"I am tired, so I will go home.",hint:"This card uses the connective meaning."},
  {id:"kung",module:"questions",kind:"word",skill:"grammar",term:"kung",meaning:"if / whether",origin:"native",example:"Sabihin mo kung puwede.",natural:"Tell me whether it is possible.",hint:"Introduces a condition or embedded question."},
  {id:"kapag",module:"questions",kind:"word",skill:"grammar",term:"kapag",meaning:"when / whenever",origin:"native",example:"Kumakain ako kapag gutom.",natural:"I eat when I am hungry.",hint:"Used for conditions expected to occur."},
  {id:"kahit",module:"questions",kind:"word",skill:"grammar",term:"kahit",meaning:"even if / even though / any",origin:"native",example:"Pupunta ako kahit umulan.",natural:"I will go even if it rains.",hint:"Signals concession."},
  {id:"para",module:"questions",kind:"word",skill:"grammar",term:"para",meaning:"for / in order to",origin:"Spanish",example:"Para sa iyo ito.",natural:"This is for you.",hint:"Often followed by sa."},
  {id:"pero",module:"questions",kind:"word",skill:"grammar",term:"pero",meaning:"but",origin:"Spanish",example:"Gusto ko, pero mahal.",natural:"I like it, but it is expensive.",hint:"A highly common contrast connector."},

  // Extended pronouns and place
  {id:"ako",module:"grammar",kind:"word",skill:"grammar",term:"ako",meaning:"I / me (ang-form)",origin:"native",example:"Ako si Alex.",natural:"I am Alex.",hint:"Used when the pronoun is the ang-marked participant."},
  {id:"ko",module:"grammar",kind:"word",skill:"grammar",term:"ko",meaning:"my / by me / I (ng-form)",origin:"native",example:"Gusto ko ito.",natural:"I like this.",hint:"Frequently follows predicates such as gusto and kailangan."},
  {id:"akin",module:"grammar",kind:"word",skill:"grammar",term:"akin",meaning:"mine / to me",origin:"native",example:"Akin ito.",natural:"This is mine.",hint:"Often appears after sa: sa akin."},
  {id:"ikaw",module:"grammar",kind:"word",skill:"grammar",term:"ikaw",meaning:"you (ang-form, full)",origin:"native",example:"Ikaw ba si Maya?",natural:"Are you Maya?",hint:"The full form; ka is usually used after the predicate."},
  {id:"ka",module:"grammar",kind:"word",skill:"grammar",term:"ka",meaning:"you (ang-form, enclitic)",origin:"native",example:"Pagod ka ba?",natural:"Are you tired?",hint:"Usually follows the predicate."},
  {id:"mo",module:"grammar",kind:"word",skill:"grammar",term:"mo",meaning:"your / by you / you (ng-form)",origin:"native",example:"Alam mo ba?",natural:"Do you know?",hint:"Common after verbs and stative predicates."},
  {id:"siya",module:"grammar",kind:"word",skill:"grammar",term:"siya",meaning:"he / she / they (singular)",origin:"native",example:"Mabait siya.",natural:"He or she is kind.",hint:"Tagalog does not mark gender here."},
  {id:"niya",module:"grammar",kind:"word",skill:"grammar",term:"niya",meaning:"his / her / by him / by her",origin:"native",example:"Sabi niya.",natural:"He or she said.",hint:"The ng-form of siya."},
  {id:"tayo",module:"grammar",kind:"word",skill:"grammar",term:"tayo",meaning:"we, including the listener",origin:"native",example:"Kain tayo.",natural:"Let us eat.",hint:"Inclusive we."},
  {id:"kami",module:"grammar",kind:"word",skill:"grammar",term:"kami",meaning:"we, excluding the listener",origin:"native",example:"Aalis kami bukas.",natural:"We are leaving tomorrow.",hint:"Exclusive we."},
  {id:"kayo",module:"grammar",kind:"word",skill:"grammar",term:"kayo",meaning:"you plural / polite singular you",origin:"native",example:"Kumusta kayo?",natural:"How are you?",hint:"Plural or respectful."},
  {id:"sila",module:"grammar",kind:"word",skill:"grammar",term:"sila",meaning:"they",origin:"native",example:"Nandito sila.",natural:"They are here.",hint:"Plural third-person pronoun."},
  {id:"ito",module:"grammar",kind:"word",skill:"grammar",term:"ito",meaning:"this",origin:"native",example:"Ano ito?",natural:"What is this?",hint:"Near the speaker."},
  {id:"iyan",module:"grammar",kind:"word",skill:"grammar",term:"iyan",meaning:"that",origin:"native",example:"Maganda iyan.",natural:"That is nice.",hint:"Near the listener."},
  {id:"iyon",module:"grammar",kind:"word",skill:"grammar",term:"iyon",meaning:"that over there",origin:"native",example:"Ano iyon?",natural:"What is that over there?",hint:"Far from both speaker and listener."},
  {id:"dito",module:"grammar",kind:"word",skill:"grammar",term:"dito",meaning:"here",origin:"native",example:"Dito ako.",natural:"I am here.",hint:"Location near the speaker."},
  {id:"diyan",module:"grammar",kind:"word",skill:"grammar",term:"diyan",meaning:"there near you",origin:"native",example:"Diyan ka lang.",natural:"Just stay there.",hint:"Location near the listener."},
  {id:"doon",module:"grammar",kind:"word",skill:"grammar",term:"doon",meaning:"there over there",origin:"native",example:"Pupunta kami doon.",natural:"We will go there.",hint:"Location far from both."},

  // Extended particles
  {id:"na",module:"grammar",kind:"word",skill:"grammar",term:"na",meaning:"already / now; linker",origin:"native",example:"Kumain na ako.",natural:"I have already eaten.",hint:"This card focuses on the already/now meaning."},
  {id:"pa",module:"grammar",kind:"word",skill:"grammar",term:"pa",meaning:"still / yet / more",origin:"native",example:"Hindi pa ako kumakain.",natural:"I have not eaten yet.",hint:"Often contrasts with na."},
  {id:"ba",module:"grammar",kind:"word",skill:"grammar",term:"ba",meaning:"question particle",origin:"native",example:"Pagod ka ba?",natural:"Are you tired?",hint:"Turns many statements into yes/no questions."},
  {id:"lang",module:"grammar",kind:"word",skill:"grammar",term:"lang",meaning:"only / just",origin:"native",example:"Tubig lang.",natural:"Just water.",hint:"Informal form of lamang."},
  {id:"naman",module:"grammar",kind:"word",skill:"grammar",term:"naman",meaning:"contrast / softening / in turn",origin:"native",example:"Ako naman?",natural:"What about me?",hint:"Its natural English meaning changes with context."},
  {id:"pala",module:"grammar",kind:"word",skill:"grammar",term:"pala",meaning:"realisation / apparently",origin:"native",example:"Ikaw pala!",natural:"Oh, it is you!",hint:"Signals newly realised information."},
  {id:"yata",module:"grammar",kind:"word",skill:"grammar",term:"yata",meaning:"perhaps / I think",origin:"native",example:"Uulan yata.",natural:"I think it might rain.",hint:"Expresses uncertainty."},
  {id:"daw",module:"grammar",kind:"word",skill:"grammar",term:"daw",meaning:"reportedly / they say",origin:"native",example:"Bukas daw.",natural:"They say it is tomorrow.",hint:"Raw is used after a vowel in many contexts."},
  {id:"din",module:"grammar",kind:"word",skill:"grammar",term:"din",meaning:"also / too",origin:"native",example:"Ako din.",natural:"Me too.",hint:"Rin is used after a vowel in many contexts."},
  {id:"po",module:"grammar",kind:"word",skill:"grammar",term:"po",meaning:"politeness marker",origin:"native",example:"Salamat po.",natural:"Thank you, respectfully.",hint:"Used to show respect."},
  {id:"muna",module:"grammar",kind:"word",skill:"grammar",term:"muna",meaning:"for now / first",origin:"native",example:"Kain muna tayo.",natural:"Let us eat first.",hint:"Temporarily prioritises an action."},
  {id:"sana",module:"grammar",kind:"word",skill:"grammar",term:"sana",meaning:"hopefully / wish",origin:"native",example:"Sana makapunta ako.",natural:"I hope I can go.",hint:"Marks a hope or unrealised wish."},
  {id:"nga",module:"grammar",kind:"word",skill:"grammar",term:"nga",meaning:"indeed / emphasis / reminder",origin:"native",example:"Tama nga.",natural:"That is indeed correct.",hint:"A discourse particle with several emphatic uses."},
  {id:"talaga",module:"grammar",kind:"word",skill:"grammar",term:"talaga",meaning:"really / truly",origin:"native",example:"Masarap talaga.",natural:"It is really delicious.",hint:"Adds strong emphasis."},

  // Verbs (30 roots)
  {id:"v_kain",module:"verbs",kind:"verb",skill:"verbs",root:"kain",meaning:"eat",origin:"native",forms:{completed:"kumain",ongoing:"kumakain",contemplated:"kakain"},example:"Kumain na ako.",natural:"I have already eaten.",hint:"-um- family; contemplated form drops -um-."},
  {id:"v_inom",module:"verbs",kind:"verb",skill:"verbs",root:"inom",meaning:"drink",origin:"native",forms:{completed:"uminom",ongoing:"umiinom",contemplated:"iinom"},example:"Umiinom siya ng tubig.",natural:"He or she is drinking water.",hint:"-um- is inserted after the initial vowel."},
  {id:"v_punta",module:"verbs",kind:"verb",skill:"verbs",root:"punta",meaning:"go",origin:"native",forms:{completed:"pumunta",ongoing:"pumupunta",contemplated:"pupunta"},example:"Pupunta kami doon.",natural:"We will go there.",hint:"Common -um- verb."},
  {id:"v_alis",module:"verbs",kind:"verb",skill:"verbs",root:"alis",meaning:"leave",origin:"native",forms:{completed:"umalis",ongoing:"umaalis",contemplated:"aalis"},example:"Aalis ako bukas.",natural:"I will leave tomorrow.",hint:"The contemplated form begins with a repeated vowel."},
  {id:"v_dating",module:"verbs",kind:"verb",skill:"verbs",root:"dating",meaning:"arrive",origin:"native",forms:{completed:"dumating",ongoing:"dumarating",contemplated:"darating"},example:"Dumating siya kahapon.",natural:"He or she arrived yesterday.",hint:"-um- is inserted after d."},
  {id:"v_uwi",module:"verbs",kind:"verb",skill:"verbs",root:"uwi",meaning:"go home",origin:"native",forms:{completed:"umuwi",ongoing:"umuuwi",contemplated:"uuwi"},example:"Uuwi na ako.",natural:"I am going home now.",hint:"A very common daily verb."},
  {id:"v_gising",module:"verbs",kind:"verb",skill:"verbs",root:"gising",meaning:"wake up",origin:"native",forms:{completed:"gumising",ongoing:"gumigising",contemplated:"gigising"},example:"Gigising ako nang maaga.",natural:"I will wake up early.",hint:"-um- actor-focus family."},
  {id:"v_tulog",module:"verbs",kind:"verb",skill:"verbs",root:"tulog",meaning:"sleep",origin:"native",forms:{completed:"natulog",ongoing:"natutulog",contemplated:"matutulog"},example:"Natutulog pa siya.",natural:"He or she is still sleeping.",hint:"Uses ma-/na- rather than -um-."},
  {id:"v_tingin",module:"verbs",kind:"verb",skill:"verbs",root:"tingin",meaning:"look",origin:"native",forms:{completed:"tumingin",ongoing:"tumitingin",contemplated:"titingin"},example:"Tumingin ka dito.",natural:"Look here.",hint:"-um- family."},
  {id:"v_kuha",module:"verbs",kind:"verb",skill:"verbs",root:"kuha",meaning:"get / take",origin:"native",forms:{completed:"kumuha",ongoing:"kumukuha",contemplated:"kukuha"},example:"Kukuha ako ng tubig.",natural:"I will get water.",hint:"-um- family."},
  {id:"v_bili",module:"verbs",kind:"verb",skill:"verbs",root:"bili",meaning:"buy",origin:"native",forms:{completed:"bumili",ongoing:"bumibili",contemplated:"bibili"},example:"Bibili ako ng pagkain.",natural:"I will buy food.",hint:"-um- family."},
  {id:"v_gamit",module:"verbs",kind:"verb",skill:"verbs",root:"gamit",meaning:"use",origin:"native",forms:{completed:"gumamit",ongoing:"gumagamit",contemplated:"gagamit"},example:"Gagamit ako ng laptop.",natural:"I will use a laptop.",hint:"A useful bridge between Tagalog grammar and English nouns."},
  {id:"v_gawa",module:"verbs",kind:"verb",skill:"verbs",root:"gawa",meaning:"make / do",origin:"native",forms:{completed:"gumawa",ongoing:"gumagawa",contemplated:"gagawa"},example:"Gagawa ako ng report.",natural:"I will make a report.",hint:"Often combines with an English object in Taglish."},
  {id:"v_tawag",module:"verbs",kind:"verb",skill:"verbs",root:"tawag",meaning:"call",origin:"native",forms:{completed:"tumawag",ongoing:"tumatawag",contemplated:"tatawag"},example:"Tatawag ako mamaya.",natural:"I will call later.",hint:"-um- family."},
  {id:"v_pasok",module:"verbs",kind:"verb",skill:"verbs",root:"pasok",meaning:"enter / go to work or school",origin:"native",forms:{completed:"pumasok",ongoing:"pumapasok",contemplated:"papasok"},example:"Papasok ka ba bukas?",natural:"Are you going to work or school tomorrow?",hint:"Context determines whether work or school is implied."},
  {id:"v_tanong",module:"verbs",kind:"verb",skill:"verbs",root:"tanong",meaning:"ask",origin:"native",forms:{completed:"nagtanong",ongoing:"nagtatanong",contemplated:"magtatanong"},example:"Magtatanong ako.",natural:"I will ask.",hint:"mag-/nag- family."},
  {id:"v_sabi",module:"verbs",kind:"verb",skill:"verbs",root:"sabi",meaning:"say / tell",origin:"native",forms:{completed:"nagsabi",ongoing:"nagsasabi",contemplated:"magsasabi"},example:"Nagsabi siya sa akin.",natural:"He or she told me.",hint:"mag-/nag- family."},
  {id:"v_bigay",module:"verbs",kind:"verb",skill:"verbs",root:"bigay",meaning:"give",origin:"native",forms:{completed:"nagbigay",ongoing:"nagbibigay",contemplated:"magbibigay"},example:"Magbibigay ako ng update.",natural:"I will give an update.",hint:"mag-/nag- family."},
  {id:"v_dala",module:"verbs",kind:"verb",skill:"verbs",root:"dala",meaning:"bring / carry",origin:"native",forms:{completed:"nagdala",ongoing:"nagdadala",contemplated:"magdadala"},example:"Magdadala ako ng pagkain.",natural:"I will bring food.",hint:"mag-/nag- family."},
  {id:"v_bayad",module:"verbs",kind:"verb",skill:"verbs",root:"bayad",meaning:"pay",origin:"native",forms:{completed:"nagbayad",ongoing:"nagbabayad",contemplated:"magbabayad"},example:"Magbabayad ako ngayon.",natural:"I will pay now.",hint:"mag-/nag- family."},
  {id:"v_hintay",module:"verbs",kind:"verb",skill:"verbs",root:"hintay",meaning:"wait",origin:"native",forms:{completed:"naghintay",ongoing:"naghihintay",contemplated:"maghihintay"},example:"Naghihintay ako dito.",natural:"I am waiting here.",hint:"mag-/nag- family with reduplication."},
  {id:"v_hanap",module:"verbs",kind:"verb",skill:"verbs",root:"hanap",meaning:"look for",origin:"native",forms:{completed:"naghanap",ongoing:"naghahanap",contemplated:"maghahanap"},example:"Naghahanap ako ng charger.",natural:"I am looking for a charger.",hint:"mag-/nag- family."},
  {id:"v_lakad",module:"verbs",kind:"verb",skill:"verbs",root:"lakad",meaning:"walk",origin:"native",forms:{completed:"naglakad",ongoing:"naglalakad",contemplated:"maglalakad"},example:"Naglalakad kami.",natural:"We are walking.",hint:"mag-/nag- family."},
  {id:"v_luto",module:"verbs",kind:"verb",skill:"verbs",root:"luto",meaning:"cook",origin:"native",forms:{completed:"nagluto",ongoing:"nagluluto",contemplated:"magluluto"},example:"Magluluto ako mamaya.",natural:"I will cook later.",hint:"mag-/nag- family."},
  {id:"v_basa",module:"verbs",kind:"verb",skill:"verbs",root:"basa",meaning:"read",origin:"native",forms:{completed:"nagbasa",ongoing:"nagbabasa",contemplated:"magbabasa"},example:"Nagbabasa siya.",natural:"He or she is reading.",hint:"The stress differs from basâ, meaning wet."},
  {id:"v_sulat",module:"verbs",kind:"verb",skill:"verbs",root:"sulat",meaning:"write",origin:"native",forms:{completed:"nagsulat",ongoing:"nagsusulat",contemplated:"magsusulat"},example:"Magsusulat ako ng email.",natural:"I will write an email.",hint:"Tagalog verb with a commonly English object."},
  {id:"v_trabaho",module:"verbs",kind:"verb",skill:"verbs",root:"trabaho",meaning:"work",origin:"Spanish",forms:{completed:"nagtrabaho",ongoing:"nagtatrabaho",contemplated:"magtatrabaho"},example:"Nagtatrabaho ako ngayon.",natural:"I am working now.",hint:"Spanish-origin root with Tagalog morphology."},
  {id:"v_aral",module:"verbs",kind:"verb",skill:"verbs",root:"aral",meaning:"study / learn",origin:"native",forms:{completed:"nag-aral",ongoing:"nag-aaral",contemplated:"mag-aaral"},example:"Nag-aaral ako ng Tagalog.",natural:"I am studying Tagalog.",hint:"Hyphens are conventional because the root begins with a vowel."},
  {id:"v_laro",module:"verbs",kind:"verb",skill:"verbs",root:"laro",meaning:"play",origin:"native",forms:{completed:"naglaro",ongoing:"naglalaro",contemplated:"maglalaro"},example:"Maglalaro sila mamaya.",natural:"They will play later.",hint:"mag-/nag- family."},
  {id:"v_drive",module:"verbs",kind:"verb",skill:"verbs",root:"drive",meaning:"drive",origin:"English",forms:{completed:"nag-drive",ongoing:"nagda-drive",contemplated:"magda-drive"},example:"Nagda-drive siya ngayon.",natural:"He or she is driving now.",hint:"The English root is familiar; learn the Tagalog aspect pattern."},

  // Spanish layer
  {id:"siguro",module:"spanish",kind:"word",skill:"vocabulary",term:"siguro",meaning:"maybe / probably",origin:"Spanish",example:"Siguro bukas.",natural:"Maybe tomorrow.",hint:"From Spanish seguro, but its Filipino meaning is commonly maybe/probably."},
  {id:"trabaho",module:"spanish",kind:"word",skill:"vocabulary",term:"trabaho",meaning:"work / job",origin:"Spanish",example:"Marami akong trabaho.",natural:"I have a lot of work.",hint:"A fully integrated everyday word."},
  {id:"oras",module:"spanish",kind:"word",skill:"vocabulary",term:"oras",meaning:"time / hour",origin:"Spanish",example:"Wala akong oras.",natural:"I do not have time.",hint:"From Spanish horas."},
  {id:"mesa",module:"spanish",kind:"word",skill:"vocabulary",term:"mesa",meaning:"table",origin:"Spanish",example:"Nasa mesa.",natural:"It is on the table.",hint:"Common household vocabulary."},
  {id:"kutsara",module:"spanish",kind:"word",skill:"vocabulary",term:"kutsara",meaning:"spoon",origin:"Spanish",example:"Kailangan ko ng kutsara.",natural:"I need a spoon.",hint:"From Spanish cuchara."},
  {id:"bintana",module:"spanish",kind:"word",skill:"vocabulary",term:"bintana",meaning:"window",origin:"Spanish",example:"Buksan mo ang bintana.",natural:"Open the window.",hint:"From Spanish ventana."},
  {id:"sapatos",module:"spanish",kind:"word",skill:"vocabulary",term:"sapatos",meaning:"shoes",origin:"Spanish",example:"Nasaan ang sapatos ko?",natural:"Where are my shoes?",hint:"From Spanish zapatos."},
  {id:"kuwento",module:"spanish",kind:"word",skill:"vocabulary",term:"kuwento",meaning:"story / tell a story",origin:"Spanish",example:"Magandang kuwento.",natural:"A good story.",hint:"Also commonly spelled kwento informally."},
  {id:"problema",module:"spanish",kind:"word",skill:"vocabulary",term:"problema",meaning:"problem",origin:"Spanish",example:"Walang problema.",natural:"No problem.",hint:"A familiar cognate with Filipino pronunciation."},
  {id:"pamilya",module:"spanish",kind:"word",skill:"vocabulary",term:"pamilya",meaning:"family",origin:"Spanish",example:"Kasama ko ang pamilya ko.",natural:"I am with my family.",hint:"From Spanish familia."},
  {id:"siyempre",module:"spanish",kind:"word",skill:"vocabulary",term:"siyempre",meaning:"of course",origin:"Spanish",example:"Siyempre naman.",natural:"Of course.",hint:"From Spanish siempre, but with a distinct Filipino meaning."},
  {id:"relos",module:"spanish",kind:"word",skill:"vocabulary",term:"relos",meaning:"watch / clock",origin:"Spanish",example:"Nasaan ang relos ko?",natural:"Where is my watch?",hint:"From Spanish reloj."},

  // Taglish
  {id:"tl_send",module:"taglish",kind:"taglish",skill:"taglish",term:"i-send",meaning:"send it / cause it to be sent",origin:"English",example:"I-send mo sa akin.",natural:"Send it to me.",hint:"Learn i- and pronoun placement; send is already familiar."},
  {id:"tl_email",module:"taglish",kind:"taglish",skill:"taglish",term:"nag-email",meaning:"emailed",origin:"English",example:"Nag-email ako kahapon.",natural:"I emailed yesterday.",hint:"nag- marks completed actor-oriented action here."},
  {id:"tl_meeting",module:"taglish",kind:"taglish",skill:"taglish",term:"mag-meeting",meaning:"have a meeting",origin:"English",example:"Mag-meeting tayo mamaya.",natural:"Let us have a meeting later.",hint:"The English noun functions as a Tagalog verb root."},
  {id:"tl_drive2",module:"taglish",kind:"taglish",skill:"taglish",term:"nag-drive",meaning:"drove",origin:"English",example:"Nag-drive siya papunta dito.",natural:"He or she drove here.",hint:"Do not relearn drive; learn nag-."},
  {id:"tl_check",module:"taglish",kind:"taglish",skill:"taglish",term:"i-check",meaning:"check it",origin:"English",example:"I-check mo muna.",natural:"Check it first.",hint:"i- foregrounds the thing to be checked."},
  {id:"tl_update",module:"taglish",kind:"taglish",skill:"taglish",term:"i-update",meaning:"update it",origin:"English",example:"I-update natin ang file.",natural:"Let us update the file.",hint:"English root with i- and a Tagalog pronoun."},
  {id:"tl_stress",module:"taglish",kind:"taglish",skill:"taglish",term:"na-stress",meaning:"became stressed",origin:"English",example:"Na-stress ako sa traffic.",natural:"I got stressed by the traffic.",hint:"na- marks an experienced or resulting state."},
  {id:"tl_login",module:"taglish",kind:"taglish",skill:"taglish",term:"mag-login",meaning:"log in",origin:"English",example:"Mag-login ka muna.",natural:"Log in first.",hint:"Tagalog verbal framing around a familiar English action."},
  {id:"tl_book",module:"taglish",kind:"taglish",skill:"taglish",term:"mag-book",meaning:"make a booking",origin:"English",example:"Mag-book tayo ng hotel.",natural:"Let us book a hotel.",hint:"The object is linked with ng."},
  {id:"tl_work",module:"taglish",kind:"taglish",skill:"taglish",term:"nagwo-work",meaning:"is working / works",origin:"English",example:"Nagwo-work pa siya.",natural:"He or she is still working.",hint:"English root with ongoing Tagalog morphology and pa."},
  {id:"tl_report",module:"taglish",kind:"taglish",skill:"taglish",term:"gumawa ng report",meaning:"make a report",origin:"Mixed",example:"Gagawa ako ng report.",natural:"I will make a report.",hint:"Retain the Tagalog verb; keep the familiar English noun."},
  {id:"tl_schedule",module:"taglish",kind:"taglish",skill:"taglish",term:"anong schedule mo?",meaning:"what is your schedule?",origin:"Mixed",example:"Anong schedule mo bukas?",natural:"What is your schedule tomorrow?",hint:"Natural Taglish often keeps schedule in English."}
];

const DIALOGUES = {
  "greetings": {
    "title": "Your first greeting",
    "level": "Beginner 1",
    "note": "Kumusta and time-of-day greetings are useful Tagalog. In casual speech, Filipinos also commonly use English hello and bye, so the course prioritises the Tagalog elements that remain worth learning.",
    "lines": [
      {
        "speaker": "A",
        "text": "Magandang umaga.",
        "tokens": [
          [
            "Maganda-ng",
            "beautiful-LINK"
          ],
          [
            "umaga",
            "morning"
          ]
        ],
        "literal": "Beautiful morning.",
        "natural": "Good morning."
      },
      {
        "speaker": "B",
        "text": "Magandang umaga rin. Kumusta ka?",
        "tokens": [
          [
            "Maganda-ng",
            "beautiful-LINK"
          ],
          [
            "umaga",
            "morning"
          ],
          [
            "rin",
            "also"
          ],
          [
            "Kumusta",
            "how-are-things"
          ],
          [
            "ka",
            "you"
          ]
        ],
        "literal": "Beautiful morning also. How-are-things you?",
        "natural": "Good morning to you too. How are you?"
      },
      {
        "speaker": "A",
        "text": "Mabuti naman. Ikaw?",
        "tokens": [
          [
            "Mabuti",
            "well"
          ],
          [
            "naman",
            "in-turn / softener"
          ],
          [
            "Ikaw",
            "you"
          ]
        ],
        "literal": "Well, in turn. You?",
        "natural": "I’m well, thank you. And you?"
      },
      {
        "speaker": "B",
        "text": "Ayos lang. Sige, ingat!",
        "tokens": [
          [
            "Ayos",
            "fine / in-order"
          ],
          [
            "lang",
            "just"
          ],
          [
            "Sige",
            "okay"
          ],
          [
            "ingat",
            "care"
          ]
        ],
        "literal": "Fine just. Okay, care!",
        "natural": "I’m fine. Okay, take care!"
      }
    ]
  },
  "introductions": {
    "title": "Meeting someone",
    "level": "Beginner 1",
    "note": "Tagalog normally does not insert an equivalent of English am/is in these identity sentences. Si is a marker used before a personal name, not a translation of “is.”",
    "lines": [
      {
        "speaker": "A",
        "text": "Kumusta! Ako si Alex.",
        "tokens": [
          [
            "Kumusta",
            "hello / how-are-things"
          ],
          [
            "Ako",
            "I"
          ],
          [
            "si",
            "personal-name marker"
          ],
          [
            "Alex",
            "Alex"
          ]
        ],
        "literal": "Hello! I [name-marker] Alex.",
        "natural": "Hello! I’m Alex."
      },
      {
        "speaker": "A",
        "text": "Anong pangalan mo?",
        "tokens": [
          [
            "Ano-ng",
            "what-LINK"
          ],
          [
            "pangalan",
            "name"
          ],
          [
            "mo",
            "your"
          ]
        ],
        "literal": "What name your?",
        "natural": "What’s your name?"
      },
      {
        "speaker": "B",
        "text": "Ako si Mia. Ikaw?",
        "tokens": [
          [
            "Ako",
            "I"
          ],
          [
            "si",
            "personal-name marker"
          ],
          [
            "Mia",
            "Mia"
          ],
          [
            "Ikaw",
            "you"
          ]
        ],
        "literal": "I [name-marker] Mia. You?",
        "natural": "I’m Mia. And you?"
      },
      {
        "speaker": "A",
        "text": "Alex ang pangalan ko.",
        "tokens": [
          [
            "Alex",
            "Alex"
          ],
          [
            "ang",
            "subject marker"
          ],
          [
            "pangalan",
            "name"
          ],
          [
            "ko",
            "my"
          ]
        ],
        "literal": "Alex [SUBJ] name my.",
        "natural": "My name is Alex."
      }
    ]
  },
  "origin": {
    "title": "Where are you from?",
    "level": "Beginner 2",
    "note": "Taga-saan asks origin. Saan ka nakatira asks current residence. These are related questions, but they should not be treated as interchangeable.",
    "lines": [
      {
        "speaker": "A",
        "text": "Taga-saan ka?",
        "tokens": [
          [
            "Taga-saan",
            "from-where"
          ],
          [
            "ka",
            "you"
          ]
        ],
        "literal": "From-where you?",
        "natural": "Where are you from?"
      },
      {
        "speaker": "B",
        "text": "Taga-England ako. Ikaw?",
        "tokens": [
          [
            "Taga-England",
            "from-England"
          ],
          [
            "ako",
            "I"
          ],
          [
            "Ikaw",
            "you"
          ]
        ],
        "literal": "From-England I. You?",
        "natural": "I’m from England. And you?"
      },
      {
        "speaker": "A",
        "text": "Taga-Pilipinas ako.",
        "tokens": [
          [
            "Taga-Pilipinas",
            "from-Philippines"
          ],
          [
            "ako",
            "I"
          ]
        ],
        "literal": "From-Philippines I.",
        "natural": "I’m from the Philippines."
      },
      {
        "speaker": "B",
        "text": "Saan ka nakatira ngayon?",
        "tokens": [
          [
            "Saan",
            "where"
          ],
          [
            "ka",
            "you"
          ],
          [
            "nakatira",
            "residing"
          ],
          [
            "ngayon",
            "now"
          ]
        ],
        "literal": "Where you residing now?",
        "natural": "Where do you live now?"
      },
      {
        "speaker": "A",
        "text": "Nakatira ako sa Marikina.",
        "tokens": [
          [
            "Nakatira",
            "residing"
          ],
          [
            "ako",
            "I"
          ],
          [
            "sa",
            "in / at"
          ],
          [
            "Marikina",
            "Marikina"
          ]
        ],
        "literal": "Residing I in Marikina.",
        "natural": "I live in Marikina."
      }
    ]
  },
  "wellbeing": {
    "title": "How are you really?",
    "level": "Beginner 2",
    "note": "Predicate-first order is especially easy to see with states: pagod ako is literally “tired I.” Okay lang is natural Taglish; the English root is already known, while lang is the new Filipino element.",
    "lines": [
      {
        "speaker": "A",
        "text": "Kumusta ka?",
        "tokens": [
          [
            "Kumusta",
            "how-are-things"
          ],
          [
            "ka",
            "you"
          ]
        ],
        "literal": "How-are-things you?",
        "natural": "How are you?"
      },
      {
        "speaker": "B",
        "text": "Okay lang. Medyo pagod ako.",
        "tokens": [
          [
            "Okay",
            "okay"
          ],
          [
            "lang",
            "just"
          ],
          [
            "Medyo",
            "somewhat"
          ],
          [
            "pagod",
            "tired"
          ],
          [
            "ako",
            "I"
          ]
        ],
        "literal": "Okay just. Somewhat tired I.",
        "natural": "I’m okay. I’m a little tired."
      },
      {
        "speaker": "B",
        "text": "Ikaw naman?",
        "tokens": [
          [
            "Ikaw",
            "you"
          ],
          [
            "naman",
            "in-turn / contrast"
          ]
        ],
        "literal": "You in-turn?",
        "natural": "How about you?"
      },
      {
        "speaker": "A",
        "text": "Mabuti naman. Gutom lang ako.",
        "tokens": [
          [
            "Mabuti",
            "well"
          ],
          [
            "naman",
            "in-turn"
          ],
          [
            "Gutom",
            "hungry"
          ],
          [
            "lang",
            "just"
          ],
          [
            "ako",
            "I"
          ]
        ],
        "literal": "Well, in turn. Hungry just I.",
        "natural": "I’m well. I’m just hungry."
      }
    ]
  },
  "questions": {
    "title": "Finding the bathroom",
    "level": "Beginner 3",
    "note": "This dialogue deliberately keeps “Excuse me” in English because it is common in Taglish. The learning target is the Tagalog structure around location, repetition, and politeness.",
    "lines": [
      {
        "speaker": "A",
        "text": "Excuse me po. Nasaan ang banyo?",
        "tokens": [
          [
            "Excuse me",
            "excuse me"
          ],
          [
            "po",
            "respect"
          ],
          [
            "Nasaan",
            "where-located"
          ],
          [
            "ang",
            "subject marker"
          ],
          [
            "banyo",
            "bathroom"
          ]
        ],
        "literal": "Excuse me, respectfully. Where-located [SUBJ] bathroom?",
        "natural": "Excuse me. Where’s the bathroom?"
      },
      {
        "speaker": "B",
        "text": "Doon, sa kanan.",
        "tokens": [
          [
            "Doon",
            "over-there"
          ],
          [
            "sa",
            "at / on"
          ],
          [
            "kanan",
            "right"
          ]
        ],
        "literal": "Over-there, at right.",
        "natural": "Over there, on the right."
      },
      {
        "speaker": "A",
        "text": "Pakiulit po.",
        "tokens": [
          [
            "Paki-ulit",
            "please-repeat"
          ],
          [
            "po",
            "respect"
          ]
        ],
        "literal": "Please-repeat, respectfully.",
        "natural": "Could you repeat that, please?"
      },
      {
        "speaker": "B",
        "text": "Sa kanan.",
        "tokens": [
          [
            "Sa",
            "at / on"
          ],
          [
            "kanan",
            "right"
          ]
        ],
        "literal": "At right.",
        "natural": "On the right."
      },
      {
        "speaker": "A",
        "text": "Salamat po.",
        "tokens": [
          [
            "Salamat",
            "thanks"
          ],
          [
            "po",
            "respect"
          ]
        ],
        "literal": "Thanks, respectfully.",
        "natural": "Thank you."
      }
    ]
  },
  "food": {
    "title": "Have you eaten?",
    "level": "Beginner 3",
    "note": "Kumain ka na? is both a literal food question and a common caring social question. Na means already/by now; pa in Hindi pa means yet.",
    "lines": [
      {
        "speaker": "A",
        "text": "Kumain ka na?",
        "tokens": [
          [
            "Kumain",
            "ate"
          ],
          [
            "ka",
            "you"
          ],
          [
            "na",
            "already"
          ]
        ],
        "literal": "Ate you already?",
        "natural": "Have you eaten?"
      },
      {
        "speaker": "B",
        "text": "Hindi pa. Gusto ko ng adobo.",
        "tokens": [
          [
            "Hindi",
            "not"
          ],
          [
            "pa",
            "yet"
          ],
          [
            "Gusto",
            "want"
          ],
          [
            "ko",
            "I / by-me"
          ],
          [
            "ng",
            "object marker"
          ],
          [
            "adobo",
            "adobo"
          ]
        ],
        "literal": "Not yet. Want I [OBJ] adobo.",
        "natural": "Not yet. I want adobo."
      },
      {
        "speaker": "A",
        "text": "May adobo dito.",
        "tokens": [
          [
            "May",
            "there-is"
          ],
          [
            "adobo",
            "adobo"
          ],
          [
            "dito",
            "here"
          ]
        ],
        "literal": "There-is adobo here.",
        "natural": "There’s adobo here."
      },
      {
        "speaker": "B",
        "text": "Sige, isa lang.",
        "tokens": [
          [
            "Sige",
            "okay"
          ],
          [
            "isa",
            "one"
          ],
          [
            "lang",
            "only"
          ]
        ],
        "literal": "Okay, one only.",
        "natural": "Okay, just one."
      }
    ]
  },
  "grammar": {
    "title": "Particles in a real exchange",
    "level": "Intermediate 1",
    "note": "Particles often carry information that English expresses through tense, adverbs, or tone. Their glosses are approximate; the literal line exposes position and function rather than claiming a perfect one-word translation.",
    "lines": [
      {
        "speaker": "A",
        "text": "Nandito na ba si Ana?",
        "tokens": [
          [
            "Nandito",
            "here-present"
          ],
          [
            "na",
            "already"
          ],
          [
            "ba",
            "question"
          ],
          [
            "si",
            "personal-name marker"
          ],
          [
            "Ana",
            "Ana"
          ]
        ],
        "literal": "Here-present already Q [name-marker] Ana?",
        "natural": "Is Ana here already?"
      },
      {
        "speaker": "B",
        "text": "Wala pa. Darating daw siya mamaya.",
        "tokens": [
          [
            "Wala",
            "absent / none"
          ],
          [
            "pa",
            "still / yet"
          ],
          [
            "Darating",
            "will-arrive"
          ],
          [
            "daw",
            "reportedly"
          ],
          [
            "siya",
            "he / she"
          ],
          [
            "mamaya",
            "later"
          ]
        ],
        "literal": "Absent still. Will-arrive reportedly she later.",
        "natural": "Not yet. They say she’ll arrive later."
      },
      {
        "speaker": "A",
        "text": "Ah, mamaya pala.",
        "tokens": [
          [
            "Ah",
            "ah"
          ],
          [
            "mamaya",
            "later"
          ],
          [
            "pala",
            "new-realisation"
          ]
        ],
        "literal": "Ah, later [realisation].",
        "natural": "Oh, so it’s later."
      }
    ]
  },
  "verbs": {
    "title": "What are you doing?",
    "level": "Intermediate 1",
    "note": "Tagalog verbs encode aspect rather than mapping cleanly onto English tense. This dialogue contrasts ongoing and contemplated actions in natural predicate-first clauses.",
    "lines": [
      {
        "speaker": "A",
        "text": "Anong ginagawa mo?",
        "tokens": [
          [
            "Ano-ng",
            "what-LINK"
          ],
          [
            "ginagawa",
            "being-done"
          ],
          [
            "mo",
            "by-you"
          ]
        ],
        "literal": "What being-done by-you?",
        "natural": "What are you doing?"
      },
      {
        "speaker": "B",
        "text": "Nagtatrabaho ako ngayon.",
        "tokens": [
          [
            "Nagtatrabaho",
            "working"
          ],
          [
            "ako",
            "I"
          ],
          [
            "ngayon",
            "now"
          ]
        ],
        "literal": "Working I now.",
        "natural": "I’m working now."
      },
      {
        "speaker": "B",
        "text": "Kakain ako mamaya.",
        "tokens": [
          [
            "Kakain",
            "will-eat"
          ],
          [
            "ako",
            "I"
          ],
          [
            "mamaya",
            "later"
          ]
        ],
        "literal": "Will-eat I later.",
        "natural": "I’ll eat later."
      },
      {
        "speaker": "A",
        "text": "Sige. Tatawag ako mamaya.",
        "tokens": [
          [
            "Sige",
            "okay"
          ],
          [
            "Tatawag",
            "will-call"
          ],
          [
            "ako",
            "I"
          ],
          [
            "mamaya",
            "later"
          ]
        ],
        "literal": "Okay. Will-call I later.",
        "natural": "Okay. I’ll call later."
      }
    ]
  },
  "spanish": {
    "title": "Spanish-origin words in ordinary Filipino",
    "level": "Intermediate 2",
    "note": "These words are not treated as foreign decorations. They are integrated Filipino vocabulary, although the origin label may make them easier to remember.",
    "lines": [
      {
        "speaker": "A",
        "text": "May oras ka ba?",
        "tokens": [
          [
            "May",
            "have / there-is"
          ],
          [
            "oras",
            "time"
          ],
          [
            "ka",
            "you"
          ],
          [
            "ba",
            "question"
          ]
        ],
        "literal": "Have time you Q?",
        "natural": "Do you have time?"
      },
      {
        "speaker": "B",
        "text": "Wala ngayon. Maraming trabaho.",
        "tokens": [
          [
            "Wala",
            "none"
          ],
          [
            "ngayon",
            "now"
          ],
          [
            "Marami-ng",
            "many-LINK"
          ],
          [
            "trabaho",
            "work"
          ]
        ],
        "literal": "None now. Much work.",
        "natural": "Not now. I have a lot of work."
      },
      {
        "speaker": "A",
        "text": "Sige, siguro bukas.",
        "tokens": [
          [
            "Sige",
            "okay"
          ],
          [
            "siguro",
            "maybe / probably"
          ],
          [
            "bukas",
            "tomorrow"
          ]
        ],
        "literal": "Okay, maybe tomorrow.",
        "natural": "Okay, maybe tomorrow."
      },
      {
        "speaker": "B",
        "text": "Siyempre.",
        "tokens": [
          [
            "Siyempre",
            "of-course"
          ]
        ],
        "literal": "Of-course.",
        "natural": "Of course."
      }
    ]
  },
  "taglish": {
    "title": "A natural work exchange",
    "level": "Intermediate 2",
    "note": "The English roots are not the vocabulary target. Focus on na, ba, mo, ko, muna, aspect affixes, and Tagalog word order.",
    "lines": [
      {
        "speaker": "A",
        "text": "Na-send mo na ba ang report?",
        "tokens": [
          [
            "Na-send",
            "sent / completed-send"
          ],
          [
            "mo",
            "by-you"
          ],
          [
            "na",
            "already"
          ],
          [
            "ba",
            "question"
          ],
          [
            "ang",
            "subject marker"
          ],
          [
            "report",
            "report"
          ]
        ],
        "literal": "Sent by-you already Q [SUBJ] report?",
        "natural": "Have you sent the report already?"
      },
      {
        "speaker": "B",
        "text": "Hindi pa. I-check ko muna.",
        "tokens": [
          [
            "Hindi",
            "not"
          ],
          [
            "pa",
            "yet"
          ],
          [
            "I-check",
            "check-it"
          ],
          [
            "ko",
            "by-me / I"
          ],
          [
            "muna",
            "first / for-now"
          ]
        ],
        "literal": "Not yet. Check-it I first.",
        "natural": "Not yet. I’ll check it first."
      },
      {
        "speaker": "A",
        "text": "Sige, i-update mo ako.",
        "tokens": [
          [
            "Sige",
            "okay"
          ],
          [
            "i-update",
            "update-it"
          ],
          [
            "mo",
            "by-you"
          ],
          [
            "ako",
            "me"
          ]
        ],
        "literal": "Okay, update-it by-you me.",
        "natural": "Okay, keep me updated."
      },
      {
        "speaker": "B",
        "text": "Okay, mag-e-email ako mamaya.",
        "tokens": [
          [
            "Okay",
            "okay"
          ],
          [
            "mag-e-email",
            "will-email"
          ],
          [
            "ako",
            "I"
          ],
          [
            "mamaya",
            "later"
          ]
        ],
        "literal": "Okay, will-email I later.",
        "natural": "Okay, I’ll email later."
      }
    ]
  }
};

const BOSS_ITEMS = [
  {prompt:"Someone greets you: “Magandang umaga po.” Choose a natural reply.",answers:["magandang umaga rin po","magandang umaga rin","magandang umaga po"],choices:["Magandang umaga rin po","Hindi pa","Tubig lang"],hint:"Repeat the greeting and use rin for “too.”"},
  {prompt:"Someone asks: “Anong pangalan mo?”",answers:["ako si alex","alex ang pangalan ko"],choices:["Ako si Alex","Taga-England ako","Mabuti naman"],hint:"Use ako si before a personal name."},
  {prompt:"Someone asks: “Taga-saan ka?”",answers:["taga-england ako","taga-uk ako","taga-london ako"],choices:["Taga-England ako","Nakatira ako sa Marikina","Pagod ako"],hint:"Use taga- plus your place of origin, followed by ako."},
  {prompt:"Someone asks: “Kumusta ka?”",answers:["mabuti naman","mabuti naman po","okay lang","ayos lang"],choices:["Mabuti naman","Anong pangalan mo?","Pakiulit po"],hint:"Choose a natural wellbeing reply."},
  {prompt:"Someone says: “Sige, ingat!”",answers:["ikaw rin","ingat din","salamat ikaw rin"],choices:["Ikaw rin","Hindi po","Magkano ito?"],hint:"Rin means also or too."}
];

const BADGES = [
  {id:"first_step",icon:"🌱",name:"First Step",description:"Complete one exercise",test:s=>s.totalAnswers>=1},
  {id:"first_greeting",icon:"👋",name:"First Greeting",description:"Reach familiarity with six greeting items",test:s=>countMasteredInModule(s,"greetings",2)>=6},
  {id:"introduced",icon:"🙂",name:"Introduced",description:"Reach familiarity with four introduction patterns",test:s=>countMasteredInModule(s,"introductions",2)>=4},
  {id:"particle_starter",icon:"💬",name:"Particle Starter",description:"Reach mastery 3 on five grammar items",test:s=>countMasteredInModule(s,"grammar",3)>=5},
  {id:"verb_builder",icon:"⚙️",name:"Verb Builder",description:"Reach mastery 3 on five verb roots",test:s=>countMasteredInModule(s,"verbs",3)>=5},
  {id:"spanish_spotter",icon:"🟠",name:"Spanish Spotter",description:"Practise five Spanish-origin items",test:s=>countPractisedByOrigin(s,"Spanish")>=5},
  {id:"taglish_navigator",icon:"🔀",name:"Taglish Navigator",description:"Reach mastery 3 on five Taglish patterns",test:s=>countMasteredInModule(s,"taglish",3)>=5},
  {id:"boss_one",icon:"👑",name:"First Meeting",description:"Pass the greeting and introduction challenge",test:s=>s.bossWins>=1}
];

const APP_VERSION = "5.3.0";
const DATA_SCHEMA_VERSION = 3;
const STORAGE_KEY = "salitaQuestProgress";
const LEGACY_STORAGE_KEYS = ["salitaQuestStateV3", "salitaQuestStateV2", "salitaQuestState"];

const DEFAULT_STATE = {
  xp: 0,
  coins: 0,
  streak: 0,
  bestStreak: 0,
  lastStudyDate: null,
  totalAnswers: 0,
  correctAnswers: 0,
  bossWins: 0,
  audioReviewCursor: 0,
  itemState: {},
  studyDates: [],
  dailyActivity: {date:null,answers:0,correct:0,reviews:0,sessions:0,questsClaimed:[],chestClaimed:false},
  settings: {
    beginnerMode: true,
    newItems: 2,
    sessionLength: 8,
    quickReviewLength: 4,
    strict: false,
    preferProduction: false,
    naturalVoice: true,
    celebrationSounds: true,
    reducedMotion: false,
    darkMode: false
  }
};

const DAILY_QUESTS = [
  {id:"session",icon:"🎯",title:"Finish one session",detail:"Complete a daily, quick, or topic session.",target:1,reward:10,metric:a=>a.sessions},
  {id:"correct",icon:"✨",title:"Get 5 answers right",detail:"Build accuracy through retrieval, not guessing streaks.",target:5,reward:12,metric:a=>a.correct},
  {id:"review",icon:"🧠",title:"Strengthen 3 learned items",detail:"Answer three review questions from language you have already seen.",target:3,reward:12,metric:a=>a.reviews}
];

const LEVEL_TITLES = [
  [1,"Starter","Build your first conversational habits."],
  [2,"Explorer","Recognise familiar phrases across contexts."],
  [3,"Connector","Link words into useful everyday exchanges."],
  [4,"Sentence Builder","Control sentence order with growing confidence."],
  [5,"Navigator","Move between topics and retrieve language flexibly."],
  [6,"Conversation Builder","Sustain longer practical exchanges."],
  [8,"Tagalog Adventurer","Use a broad, connected language toolkit."],
  [10,"Fluency Climber","Keep extending depth, speed, and flexibility."]
];

let state = loadState();
let currentView = "home";
let session = null;
let selectedChoice = null;
let sentenceBuilderState = {tiles:[], selected:[], locked:false};
let currentExercise = null;
let activeAudio = null;
let activeDialogueId = "greetings";
let dictionaryRevealIds = new Set();
let deferredInstallPrompt = null;
const audioCache = new Map();
let staticAudioManifest = null;
let staticAudioManifestPromise = null;

async function loadStaticAudioManifest() {
  if (staticAudioManifest) return staticAudioManifest;
  if (!location.protocol.startsWith("http")) return null;
  if (!staticAudioManifestPromise) {
    staticAudioManifestPromise = fetch("./audio/audio_manifest.json", {cache:"no-store"})
      .then(response => {
        if (!response.ok) throw new Error("Audio manifest unavailable");
        return response.json();
      })
      .then(data => (staticAudioManifest = data))
      .catch(() => null)
      .finally(() => { staticAudioManifestPromise = null; });
  }
  return staticAudioManifestPromise;
}

async function staticAudioUrl(text, lang) {
  const manifest = await loadStaticAudioManifest();
  const path = manifest?.entries?.[lang]?.[String(text || "").replace(/\s+/g," ").trim()];
  return path ? `./${path}` : null;
}

const HANDS_FREE_MAX_SECONDS = 118;
const handsFreeReview = {queue:[],index:0,estimatedSeconds:0,playing:false,paused:false,completed:false,runId:0,wallStart:0,totalPausedMs:0,pauseStarted:0,timerId:null,wakeLock:null,currentSpeechResolve:null};

function unwrapProgressPayload(payload) {
  if (payload && payload.app === "Salita Quest" && payload.data) return payload.data;
  return payload;
}

function migrateState(saved) {
  const raw = unwrapProgressPayload(saved) || {};
  const merged = mergeState(DEFAULT_STATE, raw);
  merged.itemState = Object.fromEntries(Object.entries(raw.itemState || {}).map(([id, value]) => {
    const item = {...(value || {})};
    const current = Number(item.mastery || 0);
    const peak = Number(item.peakMastery ?? item.highestMastery ?? current);
    return [id, {...item, mastery:current, peakMastery:Math.max(current, peak)}];
  }));
  merged.studyDates = Array.isArray(raw.studyDates) ? [...new Set(raw.studyDates)] : [];
  merged.dailyActivity = {...DEFAULT_STATE.dailyActivity, ...(raw.dailyActivity || {})};
  merged.dailyActivity.questsClaimed = Array.isArray(merged.dailyActivity.questsClaimed) ? merged.dailyActivity.questsClaimed : [];
  merged.metadata = {
    ...(raw.metadata || {}),
    schemaVersion: DATA_SCHEMA_VERSION,
    lastOpenedWith: APP_VERSION,
    migratedAt: new Date().toISOString()
  };
  return merged;
}

function loadState() {
  for (const key of [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
    try {
      const text = localStorage.getItem(key);
      if (!text) continue;
      const migrated = migrateState(JSON.parse(text));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    } catch (error) {
      console.warn(`Could not read saved progress from ${key}`, error);
    }
  }
  return structuredClone(DEFAULT_STATE);
}

function mergeState(base, saved) {
  return {
    ...structuredClone(base),
    ...saved,
    settings: {...base.settings, ...(saved.settings || {})},
    itemState: saved.itemState || {}
  };
}

function saveState() {
  state.metadata = {
    ...(state.metadata || {}),
    schemaVersion: DATA_SCHEMA_VERSION,
    lastOpenedWith: APP_VERSION,
    savedAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayKey() {
  return new Date().toISOString().slice(0,10);
}

function ensureDailyActivity() {
  const today=todayKey();
  if(!state.dailyActivity || state.dailyActivity.date!==today){
    state.dailyActivity={...DEFAULT_STATE.dailyActivity,date:today,questsClaimed:[],chestClaimed:false};
  }
  if(!Array.isArray(state.studyDates)) state.studyDates=[];
  return state.dailyActivity;
}

function levelInfo() {
  const level=Math.floor(state.xp/250)+1;
  let title=LEVEL_TITLES[0];
  LEVEL_TITLES.forEach(entry=>{if(level>=entry[0])title=entry;});
  return {level,title:title[1],subtitle:title[2],inLevel:state.xp%250,toNext:250-(state.xp%250)};
}

function recordDailyAnswer(correct,isReview=false) {
  const a=ensureDailyActivity();
  a.answers+=1;if(correct)a.correct+=1;if(isReview)a.reviews+=1;
  if(!state.studyDates.includes(todayKey())) state.studyDates.push(todayKey());
  claimDailyQuestRewards(true);
}

function recordDailySession() {
  const a=ensureDailyActivity();a.sessions+=1;
  if(!state.studyDates.includes(todayKey())) state.studyDates.push(todayKey());
  claimDailyQuestRewards(true);
}

function questProgress(quest) {
  const a=ensureDailyActivity();return Math.min(quest.target,quest.metric(a));
}

function claimDailyQuestRewards(celebrate=false) {
  const a=ensureDailyActivity();let changed=false;
  DAILY_QUESTS.forEach(q=>{
    if(questProgress(q)>=q.target && !a.questsClaimed.includes(q.id)){
      a.questsClaimed.push(q.id);state.coins+=q.reward;changed=true;
      if(celebrate)showRewardBurst(q.icon,`${q.title} · +${q.reward} coins`);
    }
  });
  if(DAILY_QUESTS.every(q=>a.questsClaimed.includes(q.id)) && !a.chestClaimed){
    a.chestClaimed=true;state.coins+=20;state.xp+=25;changed=true;
    if(celebrate){setTimeout(()=>showRewardBurst("🎁","Daily chest unlocked · +25 XP +20 coins",true),500);}
  }
  if(changed)saveState();
}

function studyWeekDays() {
  const today=new Date();const day=(today.getDay()+6)%7; // Monday = 0
  const monday=new Date(today);monday.setHours(0,0,0,0);monday.setDate(today.getDate()-day);
  return Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(monday.getDate()+i);const key=d.toISOString().slice(0,10);return {key,label:["M","T","W","T","F","S","S"][i],studied:(state.studyDates||[]).includes(key),today:key===todayKey()};});
}

function renderWeekMomentum(containerId) {
  const el=document.getElementById(containerId);if(!el)return;
  el.innerHTML=studyWeekDays().map(d=>`<div class="week-day ${d.studied?"studied":""} ${d.today?"today":""}"><span>${d.studied?"✓":d.label}</span><small>${d.label}</small></div>`).join("");
}

function renderDailyQuests() {
  const list=document.getElementById("dailyQuestList");if(!list)return;
  const a=ensureDailyActivity();
  list.innerHTML=DAILY_QUESTS.map(q=>{const p=questProgress(q),done=p>=q.target,claimed=a.questsClaimed.includes(q.id);return `<div class="daily-quest ${done?"done":""}"><div class="daily-quest-icon">${q.icon}</div><div class="daily-quest-copy"><div><strong>${q.title}</strong><span>${p}/${q.target}</span></div><small>${q.detail}</small><div class="quest-progress"><span style="width:${Math.round(p/q.target*100)}%"></span></div></div><div class="quest-reward">${claimed?"✓":`+${q.reward} 🪙`}</div></div>`;}).join("");
  const completed=DAILY_QUESTS.filter(q=>a.questsClaimed.includes(q.id)).length;
  document.getElementById("dailyQuestScore").textContent=`${completed}/3`;
  const chest=document.getElementById("questChest");chest.classList.toggle("locked",!a.chestClaimed);chest.classList.toggle("unlocked",a.chestClaimed);
  document.getElementById("questChestTitle").textContent=a.chestClaimed?"Daily chest claimed!":"Complete all 3 quests";
  document.getElementById("questChestText").textContent=a.chestClaimed?"Come back tomorrow for a fresh set of meaningful goals.":"Bonus: +25 XP and +20 coins";
  document.getElementById("questChestStatus").textContent=a.chestClaimed?"✓":"🔒";
}


function pictogram(name, extraClass="") {
  const open=`<svg class="pictogram ${extraClass}" viewBox="0 0 64 64" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">`;
  const close=`</svg>`;
  const stroke=`fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"`;
  const icons={
    home:`<path ${stroke} d="M10 30 32 12l22 18v22H38V38H26v14H10Z"/>`,
    daily:`<circle ${stroke} cx="18" cy="18" r="7"/><path ${stroke} d="M18 5v4M18 27v4M5 18h4M27 18h4M9 9l3 3M24 24l3 3M27 9l-3 3"/><path ${stroke} d="M12 49c10-14 22-14 40-18"/><path ${stroke} d="m44 27 8 4-6 7"/><path ${stroke} d="M24 43h14l7 7H24Z"/>`,
    quick:`<rect ${stroke} x="12" y="16" width="28" height="34" rx="5"/><rect ${stroke} x="22" y="10" width="28" height="34" rx="5"/><path ${stroke} d="M11 9C6 14 5 21 7 27M7 27l-4-5M7 27l5-3M53 48c5-5 6-12 4-18M57 30l4 5M57 30l-5 3"/>`,
    headphones:`<path ${stroke} d="M10 34V29c0-13 9-22 22-22s22 9 22 22v5"/><path ${stroke} d="M10 33h9v19h-5c-3 0-5-2-5-5V38c0-3 1-5 1-5ZM54 33h-9v19h5c3 0 5-2 5-5V38c0-3-1-5-1-5Z"/><path ${stroke} d="M25 41h14M28 47h8"/>`,
    topic:`<path ${stroke} d="M32 55s16-14 16-28a16 16 0 1 0-32 0c0 14 16 28 16 28Z"/><circle ${stroke} cx="32" cy="27" r="5"/><path ${stroke} d="M8 52c8-5 13-5 20-1 7 4 13 4 28-3"/>`,
    dictionary:`<path ${stroke} d="M8 15c9-4 17-3 24 3v36c-7-6-15-7-24-3ZM56 15c-9-4-17-3-24 3v36c7-6 15-7 24-3Z"/><path ${stroke} d="M16 26h9M16 34h9M39 26h9M39 34h9"/>`,
    conversation:`<path ${stroke} d="M8 13h30v23H22l-9 8v-8H8Z"/><path ${stroke} d="M30 31h26v20H44l-8 6v-6h-6"/><circle cx="18" cy="24" r="2.5" fill="currentColor"/><circle cx="25" cy="24" r="2.5" fill="currentColor"/><circle cx="32" cy="24" r="2.5" fill="currentColor"/>`,
    progress:`<path ${stroke} d="M9 53V38l11-8 11 5 12-15 12 6"/><path ${stroke} d="M43 20V8h13v12Z"/><circle cx="20" cy="30" r="3" fill="currentColor"/><circle cx="31" cy="35" r="3" fill="currentColor"/>`,
    lock:`<rect ${stroke} x="14" y="28" width="36" height="27" rx="6"/><path ${stroke} d="M22 28v-8c0-7 4-12 10-12s10 5 10 12v8"/><circle cx="32" cy="41" r="3" fill="currentColor"/>`,
    settings:`<circle ${stroke} cx="32" cy="32" r="9"/><path ${stroke} d="M32 7v7M32 50v7M7 32h7M50 32h7M14 14l5 5M45 45l5 5M50 14l-5 5M19 45l-5 5"/>`,
    map:`<path ${stroke} d="m7 14 15-6 20 7 15-6v41l-15 6-20-7-15 6Z"/><path ${stroke} d="M22 8v41M42 15v41"/><path ${stroke} d="M16 36c8-10 15-7 20-2 6 6 11 5 16-3"/>`,
    greetings:`<circle ${stroke} cx="20" cy="19" r="7"/><path ${stroke} d="M20 5v4M20 29v4M6 19h4M30 19h4M10 9l3 3M27 26l3 3M30 9l-3 3"/><path ${stroke} d="M14 50c5-8 8-12 10-12 3 0 2 8 5 8 3 0 2-11 5-11 3 0 2 10 5 10 3 0 2-7 5-7 3 0 3 7 1 13-2 5-7 8-14 8-9 0-14-3-17-9Z"/>`,
    introductions:`<circle ${stroke} cx="22" cy="23" r="8"/><circle ${stroke} cx="43" cy="24" r="7"/><path ${stroke} d="M8 50c2-10 8-15 14-15 7 0 12 5 14 15M34 49c2-8 6-12 11-12 6 0 10 4 12 12"/>`,
    origin:`<path ${stroke} d="M7 48h28V28L21 17 7 28Z"/><path ${stroke} d="M17 48V36h8v12"/><path ${stroke} d="M46 51s10-9 10-18a10 10 0 1 0-20 0c0 9 10 18 10 18Z"/><circle ${stroke} cx="46" cy="33" r="3"/>`,
    wellbeing:`<path ${stroke} d="M32 52S10 40 10 23c0-8 6-13 13-13 5 0 8 3 9 6 1-3 5-6 10-6 7 0 13 5 13 13 0 17-23 29-23 29Z"/><path ${stroke} d="M15 33h10l4-8 6 16 5-8h9"/>`,
    questions:`<path ${stroke} d="M8 12h48v34H31l-12 9v-9H8Z"/><path ${stroke} d="M25 24c1-6 13-7 14 0 1 6-7 6-7 12M32 41h.1"/>`,
    food:`<path ${stroke} d="M12 34h35c0 12-7 20-17 20S13 46 12 34Z"/><path ${stroke} d="M9 30h42M20 13c-4 5 4 7 0 12M31 11c-4 5 4 7 0 12M42 13c-4 5 4 7 0 12M53 18v30"/>`,
    grammar:`<rect ${stroke} x="7" y="13" width="20" height="15" rx="4"/><rect ${stroke} x="37" y="13" width="20" height="15" rx="4"/><rect ${stroke} x="22" y="39" width="20" height="15" rx="4"/><path ${stroke} d="M27 21h10M17 28v8h15M47 28v8H32"/>`,
    verbs:`<circle ${stroke} cx="18" cy="44" r="7"/><circle ${stroke} cx="44" cy="20" r="7"/><path ${stroke} d="M22 39c5-7 9-10 16-14M35 16l9-3 5 8M10 17h15M10 24h10M39 48h15M44 41h10"/>`,
    spanish:`<rect ${stroke} x="6" y="13" width="18" height="16" rx="4"/><rect ${stroke} x="40" y="13" width="18" height="16" rx="4"/><path ${stroke} d="M15 45c8-17 26-17 34 0M15 45h34M24 29v8M40 29v8"/>`,
    taglish:`<path ${stroke} d="M7 14h29v22H22l-8 7v-7H7Z"/><path ${stroke} d="M29 29h28v21H45l-8 7v-7h-8Z"/><path ${stroke} d="M16 24h11M38 39h10"/>`,
    boss:`<path ${stroke} d="m12 25 8 8 12-18 12 18 8-8-4 25H16Z"/><path ${stroke} d="M18 50h28"/>`
  };
  return open+(icons[name]||icons.map)+close;
}

function hydratePictograms() {
  document.querySelectorAll('[data-art]').forEach(el=>{
    if(!el.dataset.hydrated){el.innerHTML=pictogram(el.dataset.art);el.dataset.hydrated='1';}
  });
}

function renderMasteryRail() {
  const host=document.getElementById('masteryMilestones');if(!host)return;
  const points=totalLearningPoints();
  const milestones=MODULES.filter((m,i)=>i>0);
  const max=Math.max(...milestones.map(m=>m.unlockAt));
  const next=milestones.find(m=>points<m.unlockAt);
  const title=document.getElementById('masteryRailTitle');if(title)title.textContent=`${points} Mastery Point${points===1?'':'s'}`;
  const nextRegion=document.getElementById('masteryNextRegion');
  const nextText=document.getElementById('masteryNextText');
  if(next){
    const meta=MODULE_META[next.id]||{};
    if(nextRegion)nextRegion.textContent=`Next unlock · ${meta.region||next.title}`;
    if(nextText)nextText.textContent=`${next.unlockAt-points} MP to unlock ${next.title}.`;
  } else {
    if(nextRegion)nextRegion.textContent='All current regions unlocked';
    if(nextText)nextText.textContent='Keep strengthening language for long-term recall.';
  }
  const progress=Math.min(100,points/max*100);
  host.innerHTML=`<div class="mastery-track"><span class="mastery-track-fill" style="width:${progress}%"></span><span class="mastery-you" style="left:${progress}%" aria-hidden="true"></span></div>`+
    milestones.map((m,idx)=>{
      const done=points>=m.unlockAt;const isNext=next?.id===m.id;const meta=MODULE_META[m.id]||{};const left=m.unlockAt/max*100;
      return `<button class="mastery-milestone ${done?'done':''} ${isNext?'next':''}" type="button" style="left:${left}%" data-masterytip="${m.id}" role="listitem" title="${m.title} unlocks at ${m.unlockAt} mastery points"><span class="mastery-dot">${done?'✓':idx+2}</span><span class="mastery-label">${meta.region||m.title}</span><small>${m.unlockAt} MP</small></button>`;
    }).join('');
  host.querySelectorAll('[data-masterytip]').forEach(btn=>btn.addEventListener('click',()=>{
    const m=moduleById(btn.dataset.masterytip),meta=MODULE_META[m.id]||{};
    toast(`${meta.region||m.title}: ${m.title} · unlock at ${m.unlockAt} MP`);
  }));
}

function buildWorldMap() {
  const unlocked=unlockedModules();
  const current=[...unlocked].reverse().find(m=>moduleStats(m.id).pct<100)||unlocked[unlocked.length-1]||MODULES[0];
  const route=MODULES.map(m=>`${MODULE_META[m.id].x*10},${MODULE_META[m.id].y*7.6}`).join(' ');
  const art=`<svg class="world-map-art" viewBox="0 0 1000 760" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cdeff0"/><stop offset="1" stop-color="#8dd5d5"/></linearGradient><linearGradient id="land" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8e8ad"/><stop offset="1" stop-color="#bfe0a2"/></linearGradient></defs>
    <rect width="1000" height="760" rx="36" fill="url(#sea)"/>
    <path d="M60 650C90 530 160 470 245 480c58 7 100 48 157 24 72-30 75-111 160-118 70-5 101 52 164 35 68-18 84-98 153-120 42-13 78 0 111 22V760H40Z" fill="url(#land)" stroke="#80b982" stroke-width="8"/>
    <path d="M95 704c70-54 114-88 180-112 67-25 93 6 145-29 65-44 81-109 144-135 59-24 101 2 150-33 59-43 77-121 166-174" fill="none" stroke="#fff8d6" stroke-width="22" stroke-linecap="round" opacity=".92"/>
    <polyline points="${route}" fill="none" stroke="#1c746c" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="8 18" opacity=".62"/>
    <path d="M120 595q45-70 90 0M150 590q45-95 100 0" fill="#8bbf76" opacity=".75"/>
    <g fill="#5da66d" opacity=".8"><circle cx="770" cy="488" r="28"/><circle cx="817" cy="470" r="34"/><circle cx="852" cy="506" r="25"/><circle cx="742" cy="526" r="22"/></g>
    <path d="M338 280 392 180l58 100Z" fill="#a86b58"/><path d="M370 218h42l-21-38Z" fill="#ef8354"/><path d="M382 180c18-28 33-38 40-65" fill="none" stroke="#d9e3e9" stroke-width="12" stroke-linecap="round" opacity=".7"/>
    <g fill="#f0c36c" stroke="#a87930" stroke-width="4"><rect x="320" y="420" width="66" height="48" rx="5"/><path d="m313 420 40-32 40 32Z"/><rect x="416" y="435" width="55" height="42" rx="5"/><path d="m409 435 34-28 34 28Z"/></g>
    <g fill="#9b8ac8" opacity=".9"><rect x="784" y="72" width="42" height="95" rx="5"/><rect x="836" y="94" width="34" height="73" rx="5"/><rect x="881" y="55" width="48" height="112" rx="5"/><rect x="940" y="104" width="28" height="63" rx="5"/></g>
    <g fill="#fff" opacity=".42"><circle cx="110" cy="90" r="28"/><circle cx="145" cy="82" r="38"/><circle cx="185" cy="96" r="27"/><circle cx="620" cy="86" r="30"/><circle cx="657" cy="78" r="40"/><circle cx="697" cy="93" r="26"/></g>
  </svg>`;
  const nodes=MODULES.map((m,idx)=>{
    const meta=MODULE_META[m.id],stats=moduleStats(m.id),open=isModuleUnlocked(m),isCurrent=current?.id===m.id,strong=stats.pct>=80;
    const status=open?(strong?'Strong':isCurrent?'Current mission':`${stats.pct}% mastery`):`${m.unlockAt} MP`;
    return `<div class="map-stop ${open?'open':'locked'} ${isCurrent?'current':''} ${strong?'strong':''}" style="left:${meta.x}%;top:${meta.y}%" data-module="${m.id}">
      <button class="map-node" type="button" ${open?'':'disabled'} aria-label="${open?`Practise ${m.title}`:`${m.title} locked until ${m.unlockAt} mastery points`}">
        <span class="map-node-art">${open?pictogram(m.id):pictogram('lock')}</span><span class="map-node-ring" style="--map-progress:${stats.pct*3.6}deg"></span>
      </button>
      <div class="map-label"><strong>${meta.region}</strong><span>${m.title}</span><small>${status}</small></div>
    </div>`;
  }).join('');
  const camps=`<button class="map-camp" type="button" style="left:49%;top:67%" data-review-camp="6" title="Review Camp"><span>${pictogram('quick')}</span><strong>Review Camp</strong><small>6 mixed items</small></button>
    <button class="map-camp" type="button" style="left:49%;top:39%" data-review-camp="8" title="Memory Camp"><span>${pictogram('quick')}</span><strong>Memory Camp</strong><small>8 mixed items</small></button>`;
  return `<div class="world-map-stage">${art}${nodes}${camps}<div class="world-map-compass" aria-hidden="true"><b>N</b><span>✦</span></div></div>`;
}

function attachWorldMapEvents(host) {
  host.querySelectorAll('.map-stop.open').forEach(stop=>stop.querySelector('.map-node')?.addEventListener('click',()=>startModuleSession(stop.dataset.module)));
  host.querySelectorAll('[data-review-camp]').forEach(btn=>btn.addEventListener('click',()=>startSession('quick',false,{length:Number(btn.dataset.reviewCamp)})));
}

function renderJourney() {
  const path=document.getElementById("journeyPath");if(!path)return;
  path.className="journey-path world-map-host";
  path.innerHTML=buildWorldMap();
  attachWorldMapEvents(path);
}

function showRewardBurst(icon,text,big=false) {
  const el=document.getElementById("rewardBurst");if(!el)return;
  document.getElementById("rewardBurstIcon").textContent=icon;document.getElementById("rewardBurstText").textContent=text;
  el.classList.toggle("big",big);el.classList.remove("hidden");
  if(big)launchConfetti();
  clearTimeout(showRewardBurst.timer);showRewardBurst.timer=setTimeout(()=>el.classList.add("hidden"),2400);
}

function launchConfetti() {
  if(state.settings.reducedMotion)return;
  const layer=document.createElement("div");layer.className="confetti-layer";
  for(let i=0;i<28;i++){const p=document.createElement("i");p.style.setProperty('--x',`${Math.random()*100}vw`);p.style.setProperty('--delay',`${Math.random()*.45}s`);p.style.setProperty('--spin',`${Math.random()*540+180}deg`);p.style.setProperty('--h',`${Math.floor(Math.random()*5)}`);layer.appendChild(p);}document.body.appendChild(layer);setTimeout(()=>layer.remove(),1900);
}

function getItemState(id) {
  if (!state.itemState[id]) {
    state.itemState[id] = {mastery:0, peakMastery:0, interval:0, due:0, seen:0, correct:0, wrong:0, lastReviewed:null};
  }
  if (state.itemState[id].peakMastery == null) state.itemState[id].peakMastery = state.itemState[id].mastery || 0;
  return state.itemState[id];
}

function normalise(text) {
  let value = String(text || "").trim().toLowerCase().replace(/[.,!?;:'"”“]/g, "").replace(/\s+/g, " ");
  if (!state.settings.strict) value = value.replace(/-/g, " ");
  return value;
}

function accepted(userAnswer, answers) {
  const n = normalise(userAnswer);
  return answers.some(a => normalise(a) === n);
}

function totalLearningPoints() {
  // Permanent world progress uses the highest mastery ever reached on each item.
  // A difficult review may lower current mastery, but it never re-locks a region.
  return Object.values(state.itemState).reduce((sum,x)=>sum+(x.peakMastery ?? x.mastery ?? 0),0);
}

function generateExercise(item) {
  const mastery = getItemState(item.id).mastery;
  const isVerb = item.kind === "verb";
  const spoken = item.example || item.term || item.root;

  if (mastery === 0) {
    const label = isVerb ? item.root : item.term;
    return {
      item, mode:"teach", teaching:true, type:"New item",
      prompt:label,
      context:`${item.meaning}. Example: ${item.example} — ${item.natural}`,
      answers:[], hint:item.hint,
      explanation:`You have added “${label}” to your review queue.`,
      audio:spoken, choices:null
    };
  }

  if (isVerb) return generateVerbExercise(item, mastery, spoken);
  return generateWordExercise(item, mastery, spoken);
}

function generateWordExercise(item, mastery, spoken) {
  if (mastery === 1) {
    return {
      item, mode:"meaning", type:"Choose the meaning",
      prompt:`What does “${item.term}” mean?`, context:item.example,
      answers:[item.meaning], hint:item.hint,
      explanation:`${item.term} means “${item.meaning}.”`, audio:spoken,
      choices:buildChoices(item.meaning, comparableMeanings(item), 2)
    };
  }

  const builder=buildSentenceOptions(item.example,item);
  if (mastery === 2) {
    return {
      item, mode:"sentence-builder", type:"Build the sentence",
      prompt:`Build the Filipino sentence for: “${item.natural}”`,
      context:"Select the correct words in the correct order.",
      answers:[item.example], hint:item.hint, explanation:item.example,
      audio:spoken, sentenceBuilder:builder, choices:null
    };
  }
  if (mastery === 3) {
    return {
      item, mode:"sentence-builder", type:"Sentence order",
      prompt:`Put the Filipino sentence in order: “${item.natural}”`,
      context:"Some of the six words are distractors.",
      answers:[item.example], hint:item.hint, explanation:item.example,
      audio:null, sentenceBuilder:builder, choices:null
    };
  }
  const useListening=mastery>=4 && Math.random()<0.45;
  if (useListening) {
    return {
      item, mode:"sentence-builder", type:"Listen and build",
      prompt:"Listen, then build the sentence in the order you hear it.",
      context:"Replay the audio as often as needed.", answers:[item.example],
      hint:item.hint, explanation:`You heard: ${item.example}`,
      audio:spoken, sentenceBuilder:builder, choices:null
    };
  }
  return {
    item, mode:"sentence-builder", type:"Build from memory",
    prompt:`Build the Filipino sentence for: “${item.natural}”`,
    context:"Choose from six word tiles; spelling is provided for you.",
    answers:[item.example], hint:item.hint, explanation:item.example,
    audio:null, sentenceBuilder:builder, choices:null
  };
}

function generateVerbExercise(item, mastery, spoken) {
  if (mastery === 1) {
    return {
      item, mode:"meaning", type:"Know the root",
      prompt:`What does the root “${item.root}” mean?`, context:item.example,
      answers:[item.meaning], hint:item.hint,
      explanation:`${item.root} means “${item.meaning}.”`, audio:spoken,
      choices:buildChoices(item.meaning, ITEMS.filter(i=>i.kind==="verb").map(i=>i.meaning), 2)
    };
  }
  const stages=["completed","ongoing","contemplated"];
  const aspect=mastery<=4?stages[Math.min(mastery-2,2)]:stages[Math.floor(Math.random()*stages.length)];
  const guide={completed:"The action happened.",ongoing:"The action is happening or habitual.",contemplated:"The action has not happened yet."};
  const targetSentence=sentenceForVerbAspect(item,aspect);
  return {
    item, mode:"sentence-builder", type:mastery<=4?`Build with the ${aspect} form`:"Verb sentence builder",
    prompt:`Build a sentence using the ${aspect} form of “${item.root}” (${item.meaning}).`,
    context:`${guide[aspect]} The sentence uses ako for “I.”`,
    answers:[targetSentence], hint:item.hint,
    explanation:`${item.root}: ${item.forms.completed} / ${item.forms.ongoing} / ${item.forms.contemplated}`,
    audio:mastery>=4?targetSentence:null,
    sentenceBuilder:buildSentenceOptions(targetSentence,item), choices:null
  };
}
function comparableMeanings(item) {
  return ITEMS.filter(i=>i.kind!=="verb" && i.module===item.module).map(i=>i.meaning);
}

function comparableTerms(item) {
  return ITEMS.filter(i=>i.kind!=="verb" && i.module===item.module).map(i=>i.term);
}

function buildChoices(correct, pool, count=4) {
  const unique = [...new Set(pool.filter(v=>v && v !== correct))];
  shuffle(unique);
  return shuffle([correct, ...unique.slice(0,Math.max(1,count-1))]);
}

const COMMON_WORD_DISTRACTORS=["ako","ka","ko","mo","siya","po","ba","na","pa","naman","lang","rin","sa","ng","ang","ito","doon","hindi","oo","muna","mamaya","ngayon","tayo"];

function sentenceTokens(sentence) {
  return String(sentence||"").replace(/[.,!?;:“”"()]/g,"").trim().split(/\s+/).filter(Boolean);
}
function capitaliseFirst(value) {const text=String(value||"");return text?text.charAt(0).toUpperCase()+text.slice(1):text;}
function sentenceForVerbAspect(item,aspect) {
  const form=item.forms[aspect];
  if(normalise(item.example).split(" ").includes(normalise(form)))return item.example;
  return `${capitaliseFirst(form)} ako.`;
}
function buildSentenceOptions(sentence,item) {
  const targetTokens=sentenceTokens(sentence);
  const targetSet=new Set(targetTokens.map(normalise));
  const candidates=[];
  ITEMS.filter(other=>other.module===item.module&&other.id!==item.id).forEach(other=>{
    sentenceTokens(other.term||other.root||"").forEach(word=>candidates.push(word));
    sentenceTokens(other.example||"").forEach(word=>candidates.push(word));
  });
  candidates.push(...COMMON_WORD_DISTRACTORS);
  const used=new Set(targetSet);const distractors=[];
  for(const word of shuffle([...candidates])){
    const key=normalise(word);if(!key||used.has(key))continue;
    distractors.push(word);used.add(key);if(targetTokens.length+distractors.length>=6)break;
  }
  let fillerIndex=1;
  while(targetTokens.length+distractors.length<6){const filler=`word${fillerIndex++}`;if(!used.has(filler))distractors.push(filler);}
  return {targetSentence:sentence,targetTokens,words:shuffle([...targetTokens,...distractors].slice(0,6))};
}
function renderSentenceBuilder(builder) {
  sentenceBuilderState={tiles:builder.words.map((word,index)=>({id:`word_${index}_${Math.random().toString(36).slice(2,7)}`,word})),selected:[],locked:false};
  updateSentenceBuilderUI();
}
function updateSentenceBuilderUI() {
  const built=document.getElementById("builtSentence");const bank=document.getElementById("wordBank");const builder=document.getElementById("sentenceBuilder");
  if(!built||!bank||!builder)return;
  built.innerHTML="";
  if(!sentenceBuilderState.selected.length)built.innerHTML='<span class="builder-placeholder">Your sentence will appear here</span>';
  else sentenceBuilderState.selected.forEach(id=>{const tile=sentenceBuilderState.tiles.find(t=>t.id===id);if(!tile)return;const btn=document.createElement("button");btn.type="button";btn.className="selected-word-tile";btn.textContent=tile.word;btn.disabled=sentenceBuilderState.locked;btn.title="Remove this word";btn.addEventListener("click",()=>removeSelectedWord(id));built.appendChild(btn);});
  bank.innerHTML="";
  sentenceBuilderState.tiles.forEach(tile=>{const isUsed=sentenceBuilderState.selected.includes(tile.id);const btn=document.createElement("button");btn.type="button";btn.className=`word-tile ${isUsed?"used":""}`;btn.textContent=tile.word;btn.disabled=isUsed||sentenceBuilderState.locked;btn.addEventListener("click",()=>selectBuilderWord(tile.id));bank.appendChild(btn);});
  builder.classList.toggle("answered",sentenceBuilderState.locked);
  const undo=document.getElementById("undoWordBtn");const clear=document.getElementById("clearWordsBtn");
  if(undo)undo.disabled=sentenceBuilderState.locked||!sentenceBuilderState.selected.length;
  if(clear)clear.disabled=sentenceBuilderState.locked||!sentenceBuilderState.selected.length;
}
function selectBuilderWord(id){if(sentenceBuilderState.locked||sentenceBuilderState.selected.includes(id))return;sentenceBuilderState.selected.push(id);updateSentenceBuilderUI();}
function removeSelectedWord(id){if(sentenceBuilderState.locked)return;sentenceBuilderState.selected=sentenceBuilderState.selected.filter(selectedId=>selectedId!==id);updateSentenceBuilderUI();}
function undoBuilderWord(){if(sentenceBuilderState.locked)return;sentenceBuilderState.selected.pop();updateSentenceBuilderUI();}
function clearBuilderWords(){if(sentenceBuilderState.locked)return;sentenceBuilderState.selected=[];updateSentenceBuilderUI();}
function builtSentenceAnswer(){return sentenceBuilderState.selected.map(id=>sentenceBuilderState.tiles.find(tile=>tile.id===id)?.word||"").filter(Boolean).join(" ");}
function lockSentenceBuilder(){sentenceBuilderState.locked=true;updateSentenceBuilderUI();}
function playSuccessDing(){
  if(state.settings.celebrationSounds===false)return;
  try{
    const AudioContextClass=window.AudioContext||window.webkitAudioContext;if(!AudioContextClass)return;
    const context=new AudioContextClass();const now=context.currentTime;
    [{frequency:659.25,start:0,duration:0.28,volume:0.16},{frequency:987.77,start:0.10,duration:0.36,volume:0.13}].forEach(note=>{
      const oscillator=context.createOscillator();const gain=context.createGain();oscillator.type="sine";oscillator.frequency.setValueAtTime(note.frequency,now+note.start);gain.gain.setValueAtTime(0.0001,now+note.start);gain.gain.exponentialRampToValueAtTime(note.volume,now+note.start+0.015);gain.gain.exponentialRampToValueAtTime(0.0001,now+note.start+note.duration);oscillator.connect(gain);gain.connect(context.destination);oscillator.start(now+note.start);oscillator.stop(now+note.start+note.duration+0.02);
    });
    setTimeout(()=>context.close().catch(()=>{}),700);
  }catch{}
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function shuffle(arr) {
  for (let i=arr.length-1;i>0;i--) {
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

function unlockedModules() {
  const points = totalLearningPoints();
  return MODULES.filter(m=>points>=m.unlockAt);
}

function isModuleUnlocked(module) {
  return unlockedModules().some(m=>m.id===module.id);
}

function dueItems() {
  const now=Date.now();
  return ITEMS.filter(item=>{
    const s=state.itemState[item.id];
    return s && s.seen>0 && s.due<=now;
  });
}

function newItems() {
  const unlocked=unlockedModules();
  for(let index=unlocked.length-1;index>=0;index--) {
    const moduleId=unlocked[index].id;
    const unseen=ITEMS.filter(item=>item.module===moduleId && !state.itemState[item.id]);
    if(unseen.length)return unseen;
  }
  return [];
}

function practisedItems(moduleId=null) {
  return ITEMS.filter(item =>
    (!moduleId || item.module === moduleId) &&
    (state.itemState[item.id]?.seen || 0) > 0
  );
}

function reviewPool({moduleId=null, includeUnseen=false}={}) {
  const candidates = ITEMS.filter(item =>
    (!moduleId || item.module === moduleId) &&
    (includeUnseen || (state.itemState[item.id]?.seen || 0) > 0)
  );
  const now = Date.now();
  return candidates.sort((a,b) => {
    const sa = state.itemState[a.id] || {due:0, mastery:0, seen:0};
    const sb = state.itemState[b.id] || {due:0, mastery:0, seen:0};
    const aDue = sa.seen > 0 && sa.due <= now ? 1 : 0;
    const bDue = sb.seen > 0 && sb.due <= now ? 1 : 0;
    if (aDue !== bDue) return bDue - aDue;
    if ((sa.mastery || 0) !== (sb.mastery || 0)) return (sa.mastery || 0) - (sb.mastery || 0);
    return Math.random() - 0.5;
  });
}

function fillReviewQueue(base, target) {
  const queue = base.slice(0, target);
  if (!base.length) return queue;
  let cursor = 0;
  while (queue.length < target) {
    queue.push(base[cursor % base.length]);
    cursor += 1;
  }
  return queue;
}

function beginQueueSession(queue, mode, label="") {
  if (!queue.length) {
    toast("There is no learned material available for that review yet.");
    return;
  }
  session={mode,label,queue,index:0,xp:0,correct:0,answered:0,combo:0,boss:false};
  switchView("learn");
  loadExercise();
}

function startTopicReview(moduleId, option="all-learned", amount=5) {
  const module = moduleById(moduleId);
  if (!module) return;
  const includeUnseen = option === "full-topic";
  let base = reviewPool({moduleId, includeUnseen});
  if (!base.length && includeUnseen) base = ITEMS.filter(item=>item.module===moduleId);
  if (!base.length) {
    toast("Start this topic in the learning path before reviewing it.");
    return;
  }
  let queue;
  if (option === "all-learned" || option === "full-topic") queue = [...base];
  else queue = fillReviewQueue(base, Math.max(1, Number(amount) || 5));
  beginQueueSession(queue, "topic", module.title);
}

function startSession(mode="daily", boss=false, options={}) {
  if (boss) {
    if (!bossReady()) {
      toast("Build familiarity with greetings and introductions first.");
      return;
    }
    session={mode:"boss",queue:BOSS_ITEMS.map((x,idx)=>({...x,id:`boss_${idx}`})),index:0,xp:0,correct:0,answered:0,combo:0,boss:true};
    switchView("learn");
    loadBossExercise();
    return;
  }

  if (mode === "quick") {
    const target = Math.max(1, Number(options.length || state.settings.quickReviewLength || 4));
    const base = reviewPool();
    if (!base.length) {
      toast("Complete at least one learning item before starting a quick review.");
      return;
    }
    beginQueueSession(fillReviewQueue(base,target), "quick", "Quick review");
    return;
  }

  const due=shuffle([...dueItems()]);
  const fresh=[...newItems()].slice(0,state.settings.newItems);
  const target=state.settings.sessionLength;
  const unlocked=new Set(unlockedModules().map(m=>m.id));
  const seenReinforcement=shuffle(ITEMS.filter(i=>
    unlocked.has(i.module) &&
    (state.itemState[i.id]?.seen||0)>0 &&
    !due.includes(i) &&
    !fresh.includes(i)
  ));

  let pool=[...due,...fresh,...seenReinforcement].slice(0,target);
  const repeatBase=[...fresh,...due,...seenReinforcement];

  if (!repeatBase.length) {
    const firstNew=[...newItems()].slice(0,Math.max(1,state.settings.newItems));
    repeatBase.push(...firstNew);
    pool.push(...firstNew);
  }

  let cursor=0;
  while (pool.length<target && repeatBase.length) {
    pool.push(repeatBase[cursor % repeatBase.length]);
    cursor++;
  }

  if (!pool.length) pool=[ITEMS[0]];
  beginQueueSession(pool.slice(0,target), mode, "Daily session");
}

function loadExercise() {
  if (!session || session.index>=session.queue.length) {finishSession();return;}
  selectedChoice=null;
  currentExercise=generateExercise(session.queue[session.index]);
  renderExercise(currentExercise);
}

function loadBossExercise() {
  if (session.index>=session.queue.length) {finishSession();return;}
  const q=session.queue[session.index];
  currentExercise={
    item:{id:q.id,module:"boss",origin:"Mixed"}, mode:"boss", type:"Beginner conversation",
    prompt:q.prompt, context:"Choose a natural reply.", answers:q.answers,
    hint:q.hint, explanation:`A natural answer is: ${q.answers[0]}`,
    choices:q.choices, audio:null
  };
  selectedChoice=null;
  renderExercise(currentExercise);
}

function renderExercise(ex) {
  document.getElementById("exerciseType").textContent=ex.type;
  document.getElementById("lessonModule").textContent=ex.item.module==="boss"?"First Meeting":(session?.label || moduleById(ex.item.module).title);
  document.getElementById("lessonPrompt").textContent=ex.prompt;
  document.getElementById("lessonContext").textContent=ex.context||"";
  renderStructureBox(ex.item.analysis || null, !ex.teaching, Boolean(ex.teaching));
  document.getElementById("sessionCounter").textContent=`${session.index+1} / ${session.queue.length}`;
  const lessonProgress=document.getElementById("lessonProgressBar");
  if(lessonProgress)lessonProgress.style.width=`${Math.max(4,((session.index+1)/session.queue.length)*100)}%`;
  document.getElementById("hintText").textContent="";
  document.getElementById("feedbackBox").className="feedback-box hidden";
  document.getElementById("checkBtn").classList.remove("hidden");
  document.getElementById("checkBtn").textContent=ex.teaching?"I understand":"Check answer";
  document.getElementById("nextBtn").classList.add("hidden");
  document.getElementById("answerInput").value="";
  document.getElementById("answerInput").disabled=false;

  const originBadge=document.getElementById("originBadge");
  if (ex.item.origin && ex.item.origin!=="native") {
    originBadge.textContent=`${ex.item.origin}-origin / mixed`;
    originBadge.classList.remove("hidden");
  } else originBadge.classList.add("hidden");

  const audioBtn=document.getElementById("audioBtn");
  if (ex.audio) {
    audioBtn.classList.remove("hidden");
    audioBtn.dataset.text=ex.audio;
    audioBtn.textContent="🔊 Hear pronunciation";
  } else {
    audioBtn.classList.add("hidden");
    audioBtn.dataset.text="";
  }

  const input=document.getElementById("answerInput");
  const choiceGrid=document.getElementById("choiceGrid");
  const sentenceBuilder=document.getElementById("sentenceBuilder");
  choiceGrid.innerHTML="";
  sentenceBuilder.classList.add("hidden");sentenceBuilder.classList.remove("answered");
  sentenceBuilderState={tiles:[],selected:[],locked:false};

  if (ex.teaching) {
    input.classList.add("hidden");choiceGrid.classList.add("hidden");sentenceBuilder.classList.add("hidden");
    document.getElementById("hintText").textContent=ex.hint;
  } else if (ex.sentenceBuilder) {
    input.classList.add("hidden");choiceGrid.classList.add("hidden");sentenceBuilder.classList.remove("hidden");renderSentenceBuilder(ex.sentenceBuilder);
  } else if (ex.choices && ex.choices.length) {
    input.classList.add("hidden");choiceGrid.classList.remove("hidden");sentenceBuilder.classList.add("hidden");
    ex.choices.forEach(choice=>{const btn=document.createElement("button");btn.className="choice-btn";btn.textContent=choice;btn.addEventListener("click",()=>{selectedChoice=choice;[...choiceGrid.children].forEach(c=>c.classList.remove("selected"));btn.classList.add("selected");});choiceGrid.appendChild(btn);});
  } else {
    input.classList.remove("hidden");choiceGrid.classList.add("hidden");sentenceBuilder.classList.add("hidden");setTimeout(()=>input.focus(),50);
  }
  updateSessionStats();
}


function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g,ch=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
}

function renderStructureBox(analysis, locked=false, openByDefault=false) {
  const box=document.getElementById("structureBox");
  if(!box)return;
  if(!analysis || !analysis.tokens || !analysis.tokens.length) {
    box.classList.add("hidden");
    box.innerHTML="";
    return;
  }
  const tokens=analysis.tokens.map(pair=>`
    <span class="gloss-pair">
      <strong>${escapeHTML(pair[0])}</strong>
      <small>${escapeHTML(pair[1])}</small>
    </span>`).join("");
  const summaryLabel=locked ? "Answer to unlock sentence structure" : "See the sentence structure";
  box.innerHTML=`
    <details id="structureDetails" class="structure-details ${locked ? "locked" : ""}" ${openByDefault && !locked ? "open" : ""}>
      <summary>
        <span class="structure-summary-label">${locked ? "🔒" : "🧩"} ${summaryLabel}</span>
        <span class="structure-chevron" aria-hidden="true">⌄</span>
      </summary>
      <div class="structure-content">
        <div class="gloss-grid">${tokens}</div>
        <p class="literal-line"><strong>Literal order:</strong> ${escapeHTML(analysis.literal)}</p>
      </div>
    </details>`;
  box.classList.remove("hidden");

  const details=document.getElementById("structureDetails");
  const summary=details?.querySelector("summary");
  if(summary) {
    summary.addEventListener("click",event=>{
      if(details.classList.contains("locked")) {
        event.preventDefault();
        toast("Answer the question first to unlock the sentence structure.");
      }
    });
  }
}

function unlockStructureBox() {
  const details=document.getElementById("structureDetails");
  if(!details || !details.classList.contains("locked"))return;
  details.classList.remove("locked");
  details.removeAttribute("open");
  const label=details.querySelector(".structure-summary-label");
  if(label)label.textContent="🧩 See the sentence structure";
}

function dialogueLineHTML(line) {
  const tokens=line.tokens.map(pair=>`
    <span class="gloss-pair">
      <strong>${escapeHTML(pair[0])}</strong>
      <small>${escapeHTML(pair[1])}</small>
    </span>`).join("");
  return `
    <article class="dialogue-line">
      <div class="speaker-badge">${escapeHTML(line.speaker)}</div>
      <div class="dialogue-line-main">
        <div class="dialogue-text-row">
          <h4>${escapeHTML(line.text)}</h4>
          <button class="line-audio-btn" type="button" data-speech="${escapeHTML(line.text)}" aria-label="Play this line">🔊</button>
        </div>
        <div class="gloss-grid">${tokens}</div>
        <p class="literal-line"><strong>Literal order:</strong> ${escapeHTML(line.literal)}</p>
        <p class="natural-line"><strong>Natural English:</strong> ${escapeHTML(line.natural)}</p>
      </div>
    </article>`;
}

function attachDialogueAudio(container) {
  container.querySelectorAll(".line-audio-btn").forEach(btn=>{
    btn.addEventListener("click",()=>speakFilipino(btn.dataset.speech,btn));
  });
}

function openDialogue(moduleId) {
  const dialogue=DIALOGUES[moduleId];
  if(!dialogue)return;
  activeDialogueId=moduleId;
  const modal=document.getElementById("dialogueModal");
  document.getElementById("dialogueLevel").textContent=dialogue.level;
  document.getElementById("dialogueTitle").textContent=dialogue.title;
  document.getElementById("dialogueNote").textContent=dialogue.note;
  const body=document.getElementById("dialogueBody");
  body.innerHTML=dialogue.lines.map(dialogueLineHTML).join("");
  attachDialogueAudio(body);
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  document.getElementById("closeDialogueBtn").focus();
}

function closeDialogue() {
  document.getElementById("dialogueModal").classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function renderDialoguePreview(moduleId) {
  const dialogue=DIALOGUES[moduleId] || DIALOGUES.greetings;
  const preview=document.getElementById("conversationSpotlight");
  if(!preview)return;
  activeDialogueId=moduleId in DIALOGUES ? moduleId : "greetings";
  const sample=dialogue.lines.slice(0,2).map(line=>`
    <div class="preview-line">
      <span>${escapeHTML(line.speaker)}</span>
      <div><strong>${escapeHTML(line.text)}</strong><small>${escapeHTML(line.natural)}</small></div>
    </div>`).join("");
  preview.innerHTML=`
    <div class="panel-heading">
      <div>
        <p class="eyebrow">Conversation in this section</p>
        <h3>${escapeHTML(dialogue.title)}</h3>
      </div>
      <span class="status-tag ready">${escapeHTML(dialogue.level)}</span>
    </div>
    <div class="preview-dialogue">${sample}</div>
    <button class="secondary-btn" id="openCurrentDialogueBtn">See word-for-word translation</button>`;
  document.getElementById("openCurrentDialogueBtn").addEventListener("click",()=>openDialogue(activeDialogueId));
}

function checkAnswer() {
  if (!currentExercise) return;
  if (currentExercise.teaching) {
    session.answered++; session.correct++; state.totalAnswers++; state.correctAnswers++;
    session.combo++; session.bestCombo=Math.max(session.bestCombo||0,session.combo); session.xp+=5; state.xp+=5; state.coins+=1;
    recordExposure(currentExercise.item.id);
    recordDailyAnswer(true,false);
    renderFeedback(true,5,"Added to your review queue");
    updateSessionStats(); updateGlobalUI(); saveState();
    return;
  }

  const builderVisible=!document.getElementById("sentenceBuilder").classList.contains("hidden");
  const choiceVisible=!document.getElementById("choiceGrid").classList.contains("hidden");
  const answer=builderVisible?builtSentenceAnswer():(choiceVisible?selectedChoice:document.getElementById("answerInput").value);
  if (!answer) {toast(builderVisible?"Choose at least one word tile first.":"Choose or enter an answer first.");return;}

  const correct=accepted(answer,currentExercise.answers);
  const wasReview=!session.boss && (state.itemState[currentExercise.item.id]?.seen||0)>0;
  session.answered++; state.totalAnswers++;
  let xpGain=0;
  if (correct) {
    session.correct++; state.correctAnswers++; session.combo++; session.bestCombo=Math.max(session.bestCombo||0,session.combo);
    xpGain=10+Math.min(session.combo,5); session.xp+=xpGain; state.xp+=xpGain;
    state.coins+=2+(session.combo>=3?1:0);
    playSuccessDing();
    if(navigator.vibrate)navigator.vibrate(18);
    showAnswerPop(xpGain,session.combo);
  } else session.combo=0;
  recordDailyAnswer(correct,wasReview);

  if (!session.boss) updateSRS(currentExercise.item.id,correct);
  renderFeedback(correct,xpGain);
  updateSessionStats(); updateGlobalUI(); saveState();
}

function showAnswerPop(xpGain,combo) {
  const card=document.getElementById("lessonCard");if(!card)return;
  card.classList.remove("correct-pulse");void card.offsetWidth;card.classList.add("correct-pulse");
  if(combo===3||combo===5||combo===8||combo===10)showRewardBurst("⚡",`${combo} correct in a row!`,combo>=8);
  const pop=document.createElement("span");pop.className="xp-pop";pop.textContent=`+${xpGain} XP`;document.body.appendChild(pop);setTimeout(()=>pop.remove(),1000);
}

function recordExposure(itemId) {
  const s=getItemState(itemId);
  s.seen+=1; s.mastery=Math.max(s.mastery,1); s.peakMastery=Math.max(s.peakMastery||0,s.mastery); s.lastReviewed=Date.now();
  s.interval=10*60*1000; s.due=Date.now()+s.interval;
}

function updateSRS(itemId,correct) {
  const s=getItemState(itemId);
  s.seen+=1; s.lastReviewed=Date.now();
  if (correct) {
    s.correct+=1; s.mastery=Math.min(5,s.mastery+1); s.peakMastery=Math.max(s.peakMastery||0,s.mastery);
    const intervals=[0,10*60*1000,24*60*60*1000,3*24*60*60*1000,7*24*60*60*1000,14*24*60*60*1000];
    s.interval=intervals[Math.min(s.mastery,intervals.length-1)];
    s.due=Date.now()+s.interval;
  } else {
    s.wrong+=1; s.mastery=Math.max(1,s.mastery-1);
    s.interval=2*60*1000; s.due=Date.now()+s.interval;
  }
}

function renderFeedback(correct,xpGain,customTitle=null) {
  const box=document.getElementById("feedbackBox");
  box.className=`feedback-box ${correct?"":"incorrect"}`.trim();
  document.getElementById("feedbackTitle").textContent=customTitle || (correct?`Correct +${xpGain} XP`:"Not quite — that is okay");
  document.getElementById("feedbackText").textContent=correct?currentExercise.explanation:`The correct answer will return soon. ${currentExercise.hint}`;
  document.getElementById("answerDetail").textContent=correct?"":`Answer: ${currentExercise.answers[0]}`;
  document.getElementById("checkBtn").classList.add("hidden");
  document.getElementById("nextBtn").classList.remove("hidden");
  document.getElementById("answerInput").disabled=true;
  if(!document.getElementById("sentenceBuilder").classList.contains("hidden"))lockSentenceBuilder();
  unlockStructureBox();
}

function nextExercise() {session.index++; session.boss?loadBossExercise():loadExercise();}

function finishSession() {
  if (!session) return;
  const summary={mode:session.mode,label:session.label||"",answered:session.answered,correct:session.correct,xp:session.xp,bestCombo:session.bestCombo||session.combo||0,boss:session.boss};
  if (session.boss) {
    const score=session.correct/session.queue.length;
    if (score>=0.8) {state.bossWins+=1;state.xp+=75;state.coins+=20;summary.xp+=75;summary.bossWin=true;}
  } else {
    updateStudyStreak();recordDailySession();
  }
  saveState();session=null;currentExercise=null;updateAll();showSessionComplete(summary);
}

function showSessionComplete(summary) {
  const modal=document.getElementById("sessionCompleteModal");const accuracy=summary.answered?Math.round(summary.correct/summary.answered*100):0;
  let stars=accuracy>=90?3:accuracy>=70?2:1;
  document.getElementById("sessionCelebrationIcon").textContent=summary.bossWin?"👑":accuracy>=90?"🌟":accuracy>=70?"✨":"🌱";
  document.getElementById("sessionCompleteTitle").textContent=summary.bossWin?"Challenge cleared!":accuracy>=90?"Excellent session!":accuracy>=70?"Strong progress!":"Practice planted.";
  document.getElementById("sessionCompleteMessage").textContent=summary.bossWin?"You handled the conversation challenge successfully.":accuracy>=70?"Retrieval is getting stronger. The app will space these items for later review.":"Errors are useful signals. Missed items will return sooner.";
  document.getElementById("sessionStars").innerHTML=[1,2,3].map(i=>`<span class="${i<=stars?"earned":""}">★</span>`).join("");
  document.getElementById("completeAccuracy").textContent=`${accuracy}%`;document.getElementById("completeXp").textContent=`+${summary.xp}`;document.getElementById("completeCombo").textContent=String(summary.bestCombo||0);
  modal.classList.remove("hidden");document.body.classList.add("modal-open");if(stars===3)launchConfetti();
}

function closeSessionComplete(next="home") {document.getElementById("sessionCompleteModal").classList.add("hidden");document.body.classList.remove("modal-open");switchView(next);}

function updateStudyStreak() {
  const today=todayKey(); if (state.lastStudyDate===today) return;
  const yesterday=new Date(); yesterday.setDate(yesterday.getDate()-1);
  const yesterdayKey=yesterday.toISOString().slice(0,10);
  state.streak=state.lastStudyDate===yesterdayKey?state.streak+1:1;
  state.bestStreak=Math.max(state.bestStreak,state.streak); state.lastStudyDate=today;
}

function bossReady() {
  return countMasteredInModule(state,"greetings",2)>=6 &&
         countMasteredInModule(state,"introductions",2)>=3;
}
function moduleById(id) {return MODULES.find(m=>m.id===id);}
function countMastered(s) {return Object.values(s.itemState).filter(x=>x.mastery>=5).length;}
function countMasteredInModule(s,moduleId,threshold=5) {return ITEMS.filter(i=>i.module===moduleId && (s.itemState[i.id]?.mastery||0)>=threshold).length;}
function countPractisedByOrigin(s,origin) {return ITEMS.filter(i=>i.origin===origin && (s.itemState[i.id]?.seen||0)>0).length;}

function moduleStats(moduleId) {
  const items=ITEMS.filter(i=>i.module===moduleId);
  const practised=items.filter(i=>(state.itemState[i.id]?.seen||0)>0).length;
  const mastered=items.filter(i=>(state.itemState[i.id]?.mastery||0)>=5).length;
  const masteryPoints=items.reduce((sum,i)=>sum+(state.itemState[i.id]?.mastery||0),0);
  const pct=items.length?Math.round(masteryPoints/(items.length*5)*100):0;
  return {items:items.length,practised,mastered,pct};
}

function updateAll() {ensureDailyActivity();claimDailyQuestRewards(false);applyDisplaySettings();hydratePictograms();updateGlobalUI();renderMasteryRail();updateHome();renderDailyQuests();renderJourney();renderSkillTree();renderTopicReview();renderHandsFreeReview();renderDictionaryFilters();renderDictionary();renderProgress();renderBadges();updateBoss();syncSettings();checkVoiceService();updateTransferStatus();}

function updateGlobalUI() {
  document.getElementById("streakValue").textContent=state.streak;
  document.getElementById("coinValue").textContent=state.coins;
  const mobileStreak=document.getElementById("mobileStreakValue");
  const mobileCoin=document.getElementById("mobileCoinValue");
  if(mobileStreak)mobileStreak.textContent=state.streak;
  if(mobileCoin)mobileCoin.textContent=state.coins;
  const info=levelInfo();
  document.getElementById("levelValue").textContent=`Level ${info.level}`;
  document.getElementById("levelBar").style.width=`${info.inLevel/250*100}%`;
  if(document.getElementById("playerLevelBadge"))document.getElementById("playerLevelBadge").textContent=info.level;
  if(document.getElementById("playerLevelTitle"))document.getElementById("playerLevelTitle").textContent=info.title;
  if(document.getElementById("playerLevelSubtitle"))document.getElementById("playerLevelSubtitle").textContent=info.subtitle;
  if(document.getElementById("playerXpText"))document.getElementById("playerXpText").textContent=`${info.inLevel} / 250 XP`;
  if(document.getElementById("playerXpRemaining"))document.getElementById("playerXpRemaining").textContent=`${info.toNext} to next level`;
  if(document.getElementById("playerXpBar"))document.getElementById("playerXpBar").style.width=`${info.inLevel/250*100}%`;
  if(document.getElementById("progressLevelTitle"))document.getElementById("progressLevelTitle").textContent=`Level ${info.level} · ${info.title}`;
  if(document.getElementById("progressXpBar"))document.getElementById("progressXpBar").style.width=`${info.inLevel/250*100}%`;
}

function updateHome() {
  const date=new Intl.DateTimeFormat("en-PH",{weekday:"long",month:"long",day:"numeric"}).format(new Date());
  document.getElementById("todayLabel").textContent=date;
  const due=dueItems().length; const fresh=newItems().length;
  document.getElementById("reviewCount").textContent=`${due} review${due===1?"":"s"} due`;
  document.getElementById("newCount").textContent=`${Math.min(state.settings.newItems,fresh)} new item${Math.min(state.settings.newItems,fresh)===1?"":"s"}`;
  const completedToday=state.lastStudyDate===todayKey();
  document.getElementById("dailyRing").textContent=completedToday?"100%":"0%";
  document.getElementById("dailyRing").style.background=completedToday?"conic-gradient(var(--green) 360deg, #ede9e2 0deg)":"conic-gradient(var(--green) 0deg, #ede9e2 0deg)";
  const currentModule=[...unlockedModules()].reverse().find(m=>moduleStats(m.id).pct<100)||MODULES[MODULES.length-1];
  const stats=moduleStats(currentModule.id);
  document.getElementById("currentModuleTitle").textContent=currentModule.title;
  document.getElementById("currentModuleBadge").textContent=MODULES.indexOf(currentModule)+1;
  document.getElementById("currentModuleDescription").textContent=currentModule.description;
  document.getElementById("moduleProgressBar").style.width=`${stats.pct}%`;
  document.getElementById("moduleProgressText").textContent=`${stats.mastered} mastered`;
  document.getElementById("moduleItemCount").textContent=`${stats.items} items`;
  const heroPill=document.getElementById("homeHeroPill"),heroTitle=document.getElementById("homeHeroTitle"),heroText=document.getElementById("homeHeroText");
  if(heroPill)heroPill.textContent=`Next · ${currentModule.title}`;
  if(heroTitle)heroTitle.textContent=stats.practised?`Keep building ${currentModule.title.toLowerCase()}.`:`Start ${currentModule.title.toLowerCase()}.`;
  if(heroText)heroText.textContent=stats.practised?`You have practised ${stats.practised} of ${stats.items} items here. Today’s session will mix this topic with spaced review.`:currentModule.description;
  const week=studyWeekDays();const studyCount=week.filter(d=>d.studied).length;
  document.getElementById("weekMomentumLabel").textContent=studyCount?`${studyCount} study day${studyCount===1?"":"s"} this week`:"Start your week";
  renderWeekMomentum("weekMomentum");
  renderDialoguePreview(currentModule.id);
  renderHomeTopicControls();
  const homeQuick=document.getElementById("homeQuickReviewLength");
  if(homeQuick)homeQuick.value=String(state.settings.quickReviewLength || 4);
  const activityQuick=document.getElementById("activityQuickLength");
  if(activityQuick)activityQuick.value=String(state.settings.quickReviewLength || 4);
  const transferPrompt=document.getElementById("mobileTransferPrompt");
  if(transferPrompt)transferPrompt.classList.toggle("hidden",state.totalAnswers>0);
}

function badgeArt(id) {
  const map={first_step:'daily',first_greeting:'greetings',introduced:'introductions',particle_starter:'grammar',verb_builder:'verbs',spanish_spotter:'spanish',taglish_navigator:'taglish',boss_one:'boss'};
  return `<span class="badge-emblem-core">${pictogram(map[id]||'progress')}</span><span class="badge-emblem-star">★</span>`;
}
function renderBadges() {
  const shelf=document.getElementById("badgeShelf"); if(!shelf)return; shelf.innerHTML="";let count=0;
  BADGES.forEach(b=>{const unlocked=b.test(state);if(unlocked)count++;const div=document.createElement("div");div.className=`badge ${unlocked?"unlocked":"locked"}`;div.innerHTML=`<span class="badge-medal custom-badge">${badgeArt(b.id)}</span><div><strong>${b.name}</strong><small>${b.description}</small>${unlocked?`<em>EARNED</em>`:`<em>LOCKED</em>`}</div>`;shelf.appendChild(div);});
  const countEl=document.getElementById("achievementCount");if(countEl)countEl.textContent=count;
}

function renderSkillTree() {
  const tree=document.getElementById("skillTree");if(!tree)return;
  tree.className="skill-tree world-map-host full-map-host";
  tree.innerHTML=buildWorldMap()+`<div class="region-index">${MODULES.map((m,idx)=>{const meta=MODULE_META[m.id],stats=moduleStats(m.id),open=isModuleUnlocked(m);return `<article class="region-index-card ${open?'open':'locked'}"><span class="region-index-art">${open?pictogram(m.id):pictogram('lock')}</span><div><small>REGION ${idx+1}</small><strong>${meta.region}</strong><span>${m.title}</span><em>${open?`${stats.practised}/${stats.items} practised · ${stats.pct}% current mastery`:`Unlock at ${m.unlockAt} MP`}</em></div></article>`;}).join('')}</div>`;
  attachWorldMapEvents(tree);
}

function startModuleSession(moduleId) {
  const moduleItems=ITEMS.filter(i=>i.module===moduleId);
  const unseen=moduleItems.filter(i=>!state.itemState[i.id]).slice(0,state.settings.newItems);
  const seen=shuffle(moduleItems.filter(i=>(state.itemState[i.id]?.seen||0)>0));
  let pool=[...unseen,...seen].slice(0,state.settings.sessionLength);
  const repeatBase=[...unseen,...seen];

  if (!repeatBase.length && moduleItems.length) {
    repeatBase.push(moduleItems[0]);
    pool.push(moduleItems[0]);
  }

  let cursor=0;
  while(pool.length<state.settings.sessionLength && repeatBase.length) {
    pool.push(repeatBase[cursor % repeatBase.length]);
    cursor++;
  }

  session={mode:"module",queue:pool,index:0,xp:0,correct:0,answered:0,combo:0,boss:false};
  switchView("learn");
  loadExercise();
}

function renderHomeTopicControls() {
  const select=document.getElementById("homeTopicSelect");
  const empty=document.getElementById("homeTopicEmpty");
  const shortBtn=document.getElementById("homeTopicShortBtn");
  const allBtn=document.getElementById("homeTopicAllBtn");
  if(!select||!empty||!shortBtn||!allBtn)return;
  const previous=select.value;
  const covered=MODULES.filter(m=>moduleStats(m.id).practised>0);
  select.innerHTML=covered.map(m=>{
    const s=moduleStats(m.id);
    return `<option value="${m.id}">${escapeHTML(m.title)} · ${s.practised} learned</option>`;
  }).join("");
  if(covered.some(m=>m.id===previous))select.value=previous;
  const hasTopics=covered.length>0;
  select.disabled=!hasTopics;shortBtn.disabled=!hasTopics;allBtn.disabled=!hasTopics;
  empty.classList.toggle("hidden",hasTopics);
}

function renderTopicReview() {
  const grid=document.getElementById("topicReviewGrid");
  if(!grid)return;
  grid.innerHTML="";
  MODULES.forEach(module=>{
    const stats=moduleStats(module.id);
    const unlocked=isModuleUnlocked(module);
    const card=document.createElement("article");
    card.className=`topic-review-card ${unlocked?"":"locked"}`;
    card.innerHTML=`
      <div class="topic-review-icon">${unlocked?module.icon:"🔒"}</div>
      <div class="topic-review-copy">
        <p class="eyebrow">${stats.practised} of ${stats.items} encountered</p>
        <h3>${escapeHTML(module.title)}</h3>
        <p>${escapeHTML(module.description)}</p>
        <div class="large-progress"><span style="width:${stats.pct}%"></span></div>
      </div>
      <div class="topic-review-actions">
        <button class="secondary-btn topic-dialogue-btn" type="button" ${unlocked?"":"disabled"}>Conversation</button>
        <button class="secondary-btn topic-five-btn" type="button" ${stats.practised?"":"disabled"}>Review 5</button>
        <button class="primary-btn topic-all-btn" type="button" ${stats.practised?"":"disabled"}>All learned (${stats.practised})</button>
        <button class="text-btn topic-full-btn" type="button" ${unlocked?"":"disabled"}>Practise full topic (${stats.items})</button>
      </div>`;
    card.querySelector(".topic-dialogue-btn")?.addEventListener("click",()=>openDialogue(module.id));
    card.querySelector(".topic-five-btn")?.addEventListener("click",()=>startTopicReview(module.id,"sample",5));
    card.querySelector(".topic-all-btn")?.addEventListener("click",()=>startTopicReview(module.id,"all-learned"));
    card.querySelector(".topic-full-btn")?.addEventListener("click",()=>startTopicReview(module.id,"full-topic"));
    grid.appendChild(card);
  });
}

function dictionaryTagalog(item) {
  return item.kind==="verb" ? item.root : item.term;
}

function dictionaryAudio(item) {
  return item.example || item.term || item.root || "";
}

function renderDictionaryFilters() {
  const moduleFilter=document.getElementById("dictionaryModuleFilter");
  if(!moduleFilter || moduleFilter.options.length>1)return;
  moduleFilter.innerHTML=`<option value="all">All topics</option>`+MODULES.map(m=>`<option value="${m.id}">${escapeHTML(m.title)}</option>`).join("");
}

function renderDictionary() {
  const grid=document.getElementById("dictionaryGrid");
  const count=document.getElementById("dictionaryCount");
  if(!grid||!count)return;
  const query=normalise(document.getElementById("dictionarySearch")?.value||"");
  const moduleFilter=document.getElementById("dictionaryModuleFilter")?.value||"all";
  const originFilter=document.getElementById("dictionaryOriginFilter")?.value||"all";
  const mode=document.getElementById("dictionaryMode")?.value||"both";
  const filtered=ITEMS.filter(item=>{
    if(moduleFilter!=="all"&&item.module!==moduleFilter)return false;
    if(originFilter!=="all"&&item.origin!==originFilter)return false;
    const haystack=normalise([dictionaryTagalog(item),item.meaning,item.example,item.natural,item.root,Object.values(item.forms||{}).join(" ")].filter(Boolean).join(" "));
    return !query||haystack.includes(query);
  });
  count.textContent=filtered.length;
  grid.innerHTML="";
  filtered.forEach(item=>{
    const revealed=dictionaryRevealIds.has(item.id)||mode==="both";
    const hideEnglish=mode==="hideEnglish"&&!revealed;
    const hideTagalog=mode==="hideTagalog"&&!revealed;
    const s=state.itemState[item.id]||{mastery:0};
    const module=moduleById(item.module);
    const card=document.createElement("article");
    card.className="dictionary-card";
    const forms=item.kind==="verb"&&item.forms?`<div class="dictionary-forms"><span>${escapeHTML(item.forms.completed)}</span><span>${escapeHTML(item.forms.ongoing)}</span><span>${escapeHTML(item.forms.contemplated)}</span></div>`:"";
    card.innerHTML=`
      <div class="dictionary-card-top">
        <span class="dictionary-topic">${escapeHTML(module?.title||item.module)}</span>
        <span class="mastery-chip">Mastery ${s.mastery||0}/5</span>
      </div>
      <button class="dictionary-reveal-area" type="button" aria-label="Reveal this dictionary card">
        <div class="dictionary-tagalog ${hideTagalog?"concealed":""}">${hideTagalog?"Tap to reveal Tagalog":escapeHTML(dictionaryTagalog(item))}</div>
        <div class="dictionary-english ${hideEnglish?"concealed":""}">${hideEnglish?"Tap to reveal English":escapeHTML(item.meaning)}</div>
      </button>
      ${forms}
      <div class="dictionary-example"><strong>${escapeHTML(item.example||"")}</strong><span>${escapeHTML(item.natural||"")}</span></div>
      <div class="dictionary-card-footer"><span>${escapeHTML(item.origin||"native")}</span><button class="line-audio-btn dictionary-audio-btn" type="button" aria-label="Play pronunciation">🔊</button></div>`;
    card.querySelector(".dictionary-reveal-area").addEventListener("click",()=>{
      if(dictionaryRevealIds.has(item.id))dictionaryRevealIds.delete(item.id);else dictionaryRevealIds.add(item.id);
      renderDictionary();
    });
    const audioBtn=card.querySelector(".dictionary-audio-btn");
    audioBtn.addEventListener("click",()=>speakFilipino(dictionaryAudio(item),audioBtn));
    grid.appendChild(card);
  });
}

function openRandomDictionaryCard() {
  const cards=[...document.querySelectorAll(".dictionary-card")];
  if(!cards.length){toast("No dictionary entries match the current filters.");return;}
  const card=cards[Math.floor(Math.random()*cards.length)];
  card.scrollIntoView({behavior:"smooth",block:"center"});
  card.classList.add("dictionary-highlight");
  setTimeout(()=>card.classList.remove("dictionary-highlight"),1300);
}

function skillScore(skill) {
  const items=ITEMS.filter(i=>i.skill===skill); if(!items.length)return 0;
  const points=items.reduce((sum,i)=>sum+(state.itemState[i.id]?.mastery||0),0);
  return Math.round(points/(items.length*5)*100);
}

function renderProgress() {
  const week=studyWeekDays();const studyCount=week.filter(d=>d.studied).length;
  if(document.getElementById("progressWeekTitle"))document.getElementById("progressWeekTitle").textContent=`${studyCount} study day${studyCount===1?"":"s"}`;
  renderWeekMomentum("progressWeekDots");
  document.getElementById("totalXpMetric").textContent=state.xp;
  document.getElementById("masteredMetric").textContent=countMastered(state);
  document.getElementById("dueMetric").textContent=dueItems().length;
  document.getElementById("bestStreakMetric").textContent=state.bestStreak;
  const skills=[["Vocabulary","vocabulary"],["Grammar","grammar"],["Verb formation","verbs"],["Taglish patterns","taglish"],["Conversation","conversation"]];
  const bars=document.getElementById("skillBars");bars.innerHTML="";
  skills.forEach(([label,key])=>{const score=key==="conversation"?Math.min(100,state.bossWins*25+skillScore(key)):skillScore(key);const row=document.createElement("div");row.className="skill-bar-row";row.innerHTML=`<strong>${label}</strong><div class="skill-bar-track"><span style="width:${score}%"></span></div><span>${score}%</span>`;bars.appendChild(row);});
  const table=document.getElementById("inventoryTable");table.innerHTML=`<div class="inventory-row header"><span>Module</span><span>Items</span><span>Practised</span><span>Mastered</span><span>Progress</span></div>`;
  MODULES.forEach(m=>{const s=moduleStats(m.id);const row=document.createElement("div");row.className="inventory-row";row.innerHTML=`<strong>${m.title}</strong><span>${s.items}</span><span>${s.practised}</span><span>${s.mastered}</span><span>${s.pct}%</span>`;table.appendChild(row);});
}

function updateBoss() {
  const ready=bossReady();
  const status=document.getElementById("bossStatus");
  status.textContent=ready?"Ready":"Locked";
  status.className=`status-tag ${ready?"ready":""}`;
  document.getElementById("startBossBtn").disabled=!ready;
  document.getElementById("startBossBtn").style.opacity=ready?"1":"0.5";
  document.getElementById("bossUnlockNote").textContent=ready
    ?"Pass with at least 80% accuracy."
    :"Unlock requirement: reach familiarity with six greetings and three introduction patterns.";
}

function updateSessionStats() {
  if(!session)return;
  document.getElementById("sessionXp").textContent=session.xp;
  const comboChip=document.getElementById("comboChip");if(comboChip){comboChip.textContent=`⚡ ${session.combo}`;comboChip.classList.toggle("hot",session.combo>=3);}
  const lessonXp=document.getElementById("lessonXpChip");if(lessonXp)lessonXp.textContent=`${session.xp} XP`;
  document.getElementById("sessionAccuracy").textContent=session.answered?`${Math.round(session.correct/session.answered*100)}%`:"—";
  document.getElementById("sessionCombo").textContent=session.combo;
}

function applyDisplaySettings() {
  document.body.classList.toggle("reduce-motion",!!state.settings.reducedMotion);
  document.body.classList.toggle("dark-mode",!!state.settings.darkMode);
}

function syncSettings() {
  document.getElementById("beginnerSetting").checked=state.settings.beginnerMode;
  document.getElementById("newItemsSetting").value=state.settings.newItems;
  document.getElementById("sessionLengthSetting").value=state.settings.sessionLength;
  document.getElementById("quickReviewLengthSetting").value=state.settings.quickReviewLength || 4;
  document.getElementById("strictSetting").checked=state.settings.strict;
  document.getElementById("productionSetting").checked=state.settings.preferProduction;
  document.getElementById("naturalVoiceSetting").checked=state.settings.naturalVoice;
  document.getElementById("celebrationSoundSetting").checked=state.settings.celebrationSounds!==false;
  document.getElementById("reducedMotionSetting").checked=!!state.settings.reducedMotion;
  document.getElementById("darkModeSetting").checked=!!state.settings.darkMode;
}

function closeMobileMenu() {
  const sheet=document.getElementById("mobileMenuSheet");
  const backdrop=document.getElementById("mobileMenuBackdrop");
  const button=document.getElementById("mobileMenuBtn");
  sheet?.classList.add("hidden");
  backdrop?.classList.add("hidden");
  document.body.classList.remove("mobile-menu-open");
  button?.setAttribute("aria-expanded","false");
}

function openMobileMenu() {
  document.getElementById("mobileMenuSheet")?.classList.remove("hidden");
  document.getElementById("mobileMenuBackdrop")?.classList.remove("hidden");
  document.body.classList.add("mobile-menu-open");
  document.getElementById("mobileMenuBtn")?.setAttribute("aria-expanded","true");
}


function handsFreeActiveItems() {
  const now=Date.now();
  return ITEMS.filter(item=>{
    const s=state.itemState[item.id];
    const mastery=Number(s?.mastery||0);
    return s && Number(s.seen||0)>0 && mastery>0 && mastery<5;
  }).sort((a,b)=>{
    const sa=state.itemState[a.id]||{}, sb=state.itemState[b.id]||{};
    const aDue=Number(sa.due||0)<=now?0:1, bDue=Number(sb.due||0)<=now?0:1;
    if(aDue!==bDue)return aDue-bDue;
    if((sa.mastery||0)!==(sb.mastery||0))return (sa.mastery||0)-(sb.mastery||0);
    return Number(sa.lastReviewed||0)-Number(sb.lastReviewed||0);
  });
}

function handsFreeTagalog(item) {
  return (item.example || item.term || item.root || "").replace(/\s+/g," ").trim();
}
function handsFreeEnglish(item) {
  return (item.natural || item.meaning || "").replace(/\s+/g," ").trim();
}
function estimateSpeechSeconds(text,wpm) {
  const words=String(text||"").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1.2, words/(wpm/60)+0.55);
}
function estimateHandsFreeItemSeconds(item) {
  return estimateSpeechSeconds(handsFreeTagalog(item),125)+5+estimateSpeechSeconds(handsFreeEnglish(item),145)+0.7;
}
function formatAudioTime(seconds) {
  const n=Math.max(0,Math.round(Number(seconds)||0));
  return `${Math.floor(n/60)}:${String(n%60).padStart(2,"0")}`;
}

function buildHandsFreeQueue({advance=false}={}) {
  const active=handsFreeActiveItems();
  if(!active.length){
    handsFreeReview.queue=[];handsFreeReview.index=0;handsFreeReview.estimatedSeconds=0;handsFreeReview.completed=false;
    renderHandsFreeReview();return;
  }
  if(advance && handsFreeReview.queue.length){
    state.audioReviewCursor=(Number(state.audioReviewCursor||0)+handsFreeReview.queue.length)%active.length;
    saveState();
  }
  const cursor=((Number(state.audioReviewCursor||0)%active.length)+active.length)%active.length;
  const rotated=[...active.slice(cursor),...active.slice(0,cursor)];
  const selected=[];let total=0;
  for(const item of rotated){
    const duration=estimateHandsFreeItemSeconds(item);
    if(selected.length && total+duration>HANDS_FREE_MAX_SECONDS)continue;
    selected.push(item);total+=duration;
    if(total>=HANDS_FREE_MAX_SECONDS-4)break;
  }
  if(!selected.length){selected.push(rotated[0]);total=estimateHandsFreeItemSeconds(rotated[0]);}
  handsFreeReview.queue=selected;handsFreeReview.index=0;handsFreeReview.estimatedSeconds=Math.min(HANDS_FREE_MAX_SECONDS,total);handsFreeReview.completed=false;
  renderHandsFreeReview();
}

function renderHandsFreeReview() {
  const list=document.getElementById("handsFreeQueueList");if(!list)return;
  const active=handsFreeActiveItems();
  if(!handsFreeReview.queue.length && active.length) buildHandsFreeQueue();
  const queue=handsFreeReview.queue;
  document.getElementById("handsFreeActiveCount").textContent=`${active.length} active`;
  document.getElementById("handsFreeTrackTitle").textContent=active.length?`${queue.length} phrase${queue.length===1?"":"s"} ready for active recall`:`No active phrases yet`;
  document.getElementById("handsFreeTrackSummary").textContent=active.length?`${queue.length} of ${active.length} items are in this mix. More active items rotate into later mixes.`:`Complete a lesson first. Items at mastery levels 1–4 will automatically appear here.`;
  document.getElementById("handsFreeApproxTime").textContent=`Approx. ${formatAudioTime(handsFreeReview.estimatedSeconds)}`;
  document.getElementById("handsFreeItemCounter").textContent=queue.length?`${Math.min(handsFreeReview.index+1,queue.length)} / ${queue.length}`:"0 / 0";
  const play=document.getElementById("handsFreePlayBtn"),pause=document.getElementById("handsFreePauseBtn"),stop=document.getElementById("handsFreeStopBtn"),mix=document.getElementById("handsFreeNewMixBtn");
  play.disabled=!queue.length || handsFreeReview.playing;
  play.textContent=handsFreeReview.completed?"▶ Play next mix":"▶ Play review";
  pause.disabled=!handsFreeReview.playing;pause.textContent=handsFreeReview.paused?"Resume":"Pause";
  stop.disabled=!handsFreeReview.playing;mix.disabled=handsFreeReview.playing || !active.length;
  list.innerHTML=queue.length?queue.map((item,i)=>{
    const s=state.itemState[item.id]||{};const mod=MODULES.find(m=>m.id===item.module);
    const classes=["audio-queue-item",i===handsFreeReview.index&&handsFreeReview.playing?"current":"",i<handsFreeReview.index?"done":""].filter(Boolean).join(" ");
    return `<div class="${classes}"><span class="audio-queue-num">${i+1}</span><div class="audio-queue-copy"><strong>${escapeHTML(handsFreeTagalog(item))}</strong><small>${escapeHTML(mod?.title||item.module)}</small></div><span class="audio-queue-mastery">M${Number(s.mastery||0)}</span></div>`;
  }).join(""):`<div class="audio-queue-empty">Your hands-free track fills automatically after you have started learning some phrases.</div>`;
  if(!handsFreeReview.playing && !handsFreeReview.completed){
    document.getElementById("handsFreePhase").textContent="READY";
    document.getElementById("handsFreeNowTagalog").textContent=queue.length?"Press play and listen for the first Tagalog phrase.":"Start a learning session to add phrases.";
    document.getElementById("handsFreeNowEnglish").textContent="The English answer stays hidden until each recall gap ends.";
    document.getElementById("handsFreeCountdown").textContent="5";
    document.getElementById("handsFreeRecallPrompt").classList.remove("active");
    document.getElementById("handsFreeProgressBar").style.width="0%";
    document.getElementById("handsFreeElapsed").textContent="0:00";
  }
}

function handsFreeElapsedSeconds() {
  if(!handsFreeReview.wallStart)return 0;
  const pausedExtra=handsFreeReview.paused&&handsFreeReview.pauseStarted?Date.now()-handsFreeReview.pauseStarted:0;
  return Math.max(0,(Date.now()-handsFreeReview.wallStart-handsFreeReview.totalPausedMs-pausedExtra)/1000);
}
function updateHandsFreeClock() {
  const elapsed=handsFreeElapsedSeconds();
  const elapsedEl=document.getElementById("handsFreeElapsed");if(elapsedEl)elapsedEl.textContent=formatAudioTime(elapsed);
  const bar=document.getElementById("handsFreeProgressBar");if(bar)bar.style.width=`${Math.min(100,elapsed/HANDS_FREE_MAX_SECONDS*100)}%`;
  if(elapsed>=120 && handsFreeReview.playing) stopHandsFreeReview("Two-minute review complete.");
}
async function acquireHandsFreeWakeLock() {
  try{if("wakeLock" in navigator)handsFreeReview.wakeLock=await navigator.wakeLock.request("screen");}catch{}
}
async function releaseHandsFreeWakeLock() {
  try{await handsFreeReview.wakeLock?.release();}catch{}finally{handsFreeReview.wakeLock=null;}
}
function handsFreeDelay(ms,runId,onTick=null) {
  return new Promise(async resolve=>{
    let remaining=ms;
    while(remaining>0 && handsFreeReview.runId===runId && handsFreeReview.playing){
      if(handsFreeReview.paused){await new Promise(r=>setTimeout(r,120));continue;}
      if(onTick)onTick(remaining);
      const chunk=Math.min(120,remaining);await new Promise(r=>setTimeout(r,chunk));remaining-=chunk;
    }
    resolve(handsFreeReview.runId===runId && handsFreeReview.playing);
  });
}

async function handsFreeSpeak(text,lang,runId) {
  if(handsFreeReview.runId!==runId || !handsFreeReview.playing)return false;

  if(state.settings.naturalVoice && location.protocol.startsWith("http")){
    try{
      const staticUrl=await staticAudioUrl(text,lang);
      if(staticUrl){
        if(handsFreeReview.runId!==runId)return false;
        if(activeAudio){activeAudio.pause();activeAudio=null;}
        const audio=new Audio(staticUrl);activeAudio=audio;
        const ok=await new Promise(resolve=>{
          let settled=false;const finish=value=>{if(settled)return;settled=true;handsFreeReview.currentSpeechResolve=null;resolve(value);};
          handsFreeReview.currentSpeechResolve=()=>finish(false);audio.onended=()=>finish(true);audio.onerror=()=>finish(false);audio.play().catch(()=>finish(false));
        });
        if(activeAudio===audio)activeAudio=null;
        if(ok)return handsFreeReview.runId===runId && handsFreeReview.playing;
      }
    }catch{}
  }

  if(lang==="fil-PH" && state.settings.naturalVoice && location.protocol.startsWith("http")){
    try{
      let url=audioCache.get(text);
      if(!url){const response=await fetch("/api/speech",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text})});if(!response.ok)throw new Error("Natural voice unavailable");const blob=await response.blob();url=URL.createObjectURL(blob);audioCache.set(text,url);}
      if(handsFreeReview.runId!==runId)return false;
      if(activeAudio){activeAudio.pause();activeAudio=null;}
      const audio=new Audio(url);activeAudio=audio;
      const ok=await new Promise(resolve=>{
        let settled=false;const finish=value=>{if(settled)return;settled=true;handsFreeReview.currentSpeechResolve=null;resolve(value);};
        handsFreeReview.currentSpeechResolve=()=>finish(false);audio.onended=()=>finish(true);audio.onerror=()=>finish(false);audio.play().catch(()=>finish(false));
      });
      if(activeAudio===audio)activeAudio=null;
      if(ok)return handsFreeReview.runId===runId && handsFreeReview.playing;
    }catch{}
  }

  if(!("speechSynthesis" in window))return false;
  return await new Promise(resolve=>{
    let settled=false;const finish=value=>{if(settled)return;settled=true;handsFreeReview.currentSpeechResolve=null;resolve(value);};
    handsFreeReview.currentSpeechResolve=()=>finish(false);
    speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(text);utterance.lang=lang;utterance.rate=lang==="fil-PH"?.78:.9;utterance.pitch=1;
    const voices=speechSynthesis.getVoices();
    const preferred=lang==="fil-PH"?(voices.find(v=>v.lang.toLowerCase().startsWith("fil"))||voices.find(v=>v.lang.toLowerCase().startsWith("tl"))):voices.find(v=>v.lang.toLowerCase().startsWith("en-gb"))||voices.find(v=>v.lang.toLowerCase().startsWith("en"));
    if(preferred)utterance.voice=preferred;utterance.onend=()=>finish(true);utterance.onerror=()=>finish(false);speechSynthesis.speak(utterance);
  });
}

async function startHandsFreeReview() {
  if(handsFreeReview.playing)return;
  if(handsFreeReview.completed)buildHandsFreeQueue({advance:true});
  if(!handsFreeReview.queue.length)buildHandsFreeQueue();
  if(!handsFreeReview.queue.length){toast("Start learning some phrases first — active mastery items will appear here automatically.");return;}
  handsFreeReview.playing=true;handsFreeReview.paused=false;handsFreeReview.completed=false;handsFreeReview.index=0;handsFreeReview.runId+=1;handsFreeReview.wallStart=Date.now();handsFreeReview.totalPausedMs=0;handsFreeReview.pauseStarted=0;
  const runId=handsFreeReview.runId;await acquireHandsFreeWakeLock();
  clearInterval(handsFreeReview.timerId);handsFreeReview.timerId=setInterval(updateHandsFreeClock,250);renderHandsFreeReview();
  for(let i=0;i<handsFreeReview.queue.length;i++){
    if(runId!==handsFreeReview.runId || !handsFreeReview.playing)break;
    if(handsFreeElapsedSeconds()>=116)break;
    handsFreeReview.index=i;const item=handsFreeReview.queue[i];
    document.getElementById("handsFreeItemCounter").textContent=`${i+1} / ${handsFreeReview.queue.length}`;
    document.getElementById("handsFreePhase").textContent="LISTEN — TAGALOG";
    document.getElementById("handsFreeNowTagalog").textContent=handsFreeTagalog(item);
    document.getElementById("handsFreeNowEnglish").textContent="English answer hidden — recall it during the gap.";
    document.getElementById("handsFreeRecallPrompt").classList.remove("active");renderHandsFreeReview();
    const spoken=await handsFreeSpeak(handsFreeTagalog(item),"fil-PH",runId);if(!spoken||runId!==handsFreeReview.runId||!handsFreeReview.playing)break;
    document.getElementById("handsFreePhase").textContent="YOUR TURN";document.getElementById("handsFreeRecallPrompt").classList.add("active");
    const recalled=await handsFreeDelay(5000,runId,remaining=>{document.getElementById("handsFreeCountdown").textContent=String(Math.max(1,Math.ceil(remaining/1000)));});
    document.getElementById("handsFreeRecallPrompt").classList.remove("active");if(!recalled)break;
    document.getElementById("handsFreeCountdown").textContent="5";document.getElementById("handsFreePhase").textContent="CHECK — ENGLISH";
    document.getElementById("handsFreeNowEnglish").textContent=handsFreeEnglish(item);
    const checked=await handsFreeSpeak(handsFreeEnglish(item),"en-GB",runId);if(!checked||runId!==handsFreeReview.runId||!handsFreeReview.playing)break;
    await handsFreeDelay(650,runId);
  }
  if(runId===handsFreeReview.runId && handsFreeReview.playing){
    handsFreeReview.playing=false;handsFreeReview.paused=false;handsFreeReview.completed=true;clearInterval(handsFreeReview.timerId);handsFreeReview.timerId=null;updateHandsFreeClock();
    document.getElementById("handsFreePhase").textContent="COMPLETE";document.getElementById("handsFreeNowTagalog").textContent="Review track complete.";document.getElementById("handsFreeNowEnglish").textContent="Play again for the next rotating mix of active phrases.";
    document.getElementById("handsFreeProgressBar").style.width="100%";await releaseHandsFreeWakeLock();renderHandsFreeReview();toast("Hands-free review complete.");
  }
}

function toggleHandsFreePause() {
  if(!handsFreeReview.playing)return;
  if(!handsFreeReview.paused){handsFreeReview.paused=true;handsFreeReview.pauseStarted=Date.now();try{activeAudio?.pause();window.speechSynthesis?.pause();}catch{}}
  else{handsFreeReview.paused=false;if(handsFreeReview.pauseStarted)handsFreeReview.totalPausedMs+=Date.now()-handsFreeReview.pauseStarted;handsFreeReview.pauseStarted=0;try{activeAudio?.play().catch(()=>{});window.speechSynthesis?.resume();}catch{}}
  renderHandsFreeReview();
}
function stopHandsFreeReview(message="Review stopped.") {
  if(!handsFreeReview.playing)return;
  handsFreeReview.runId+=1;handsFreeReview.playing=false;handsFreeReview.paused=false;handsFreeReview.completed=false;clearInterval(handsFreeReview.timerId);handsFreeReview.timerId=null;
  try{if(activeAudio){activeAudio.pause();activeAudio=null;}window.speechSynthesis?.cancel();handsFreeReview.currentSpeechResolve?.();}catch{}handsFreeReview.currentSpeechResolve=null;releaseHandsFreeWakeLock();
  renderHandsFreeReview();document.getElementById("handsFreePhase").textContent="STOPPED";document.getElementById("handsFreeNowEnglish").textContent="Press play to restart this mix.";toast(message);
}

function switchView(view) {
  currentView=view;
  document.body.dataset.currentView=view;
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.getElementById(`${view}View`).classList.add("active");
  document.querySelectorAll("[data-view]").forEach(btn=>btn.classList.toggle("active",btn.dataset.view===view));
  const titles={
    home:"Home",
    learn:"Lesson",
    review:"Topic review",
    audioReview:"Hands-Free",
    dictionary:"Dictionary",
    skills:"Skill path",
    boss:"Challenges",
    progress:"Progress",
    settings:"Settings"
  };
  document.getElementById("viewTitle").textContent={
    home:"Magandang araw!",learn:"Conversation-first training",review:"Choose what to review",audioReview:"Hands-free active recall",dictionary:"Explore the course dictionary",skills:"Your progressive conversation path",boss:"Meet someone in Filipino",progress:"Your learning evidence",settings:"Training preferences"
  }[view]||"Salita Quest";
  const mobileTitle=document.getElementById("mobileViewTitle");
  if(mobileTitle)mobileTitle.textContent=titles[view]||"Salita Quest";
  closeMobileMenu();
  window.scrollTo({top:0,behavior:"smooth"});
}

async function speakFilipino(text, sourceButton=null) {
  const btn=sourceButton || document.getElementById("audioBtn");
  const originalButtonText=btn?.textContent || "🔊";
  if(activeAudio){activeAudio.pause();activeAudio=null;}
  if(state.settings.naturalVoice && location.protocol.startsWith("http")) {
    try {
      if(btn){btn.disabled=true;btn.textContent="Loading audio…";}
      const staticUrl=await staticAudioUrl(text,"fil-PH");
      if(staticUrl){
        activeAudio=new Audio(staticUrl);await activeAudio.play();
        if(btn){btn.textContent=sourceButton?originalButtonText:"🔊 Replay pronunciation";btn.disabled=false;}return;
      }

      let url=audioCache.get(text);
      if(!url){
        const response=await fetch("/api/speech",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text})});
        if(!response.ok) throw new Error("Natural voice unavailable");
        const blob=await response.blob();url=URL.createObjectURL(blob);audioCache.set(text,url);
      }
      activeAudio=new Audio(url);await activeAudio.play();
      if(btn){btn.textContent=sourceButton?originalButtonText:"🔊 Replay pronunciation";btn.disabled=false;}return;
    } catch(err) {
      if(btn){btn.disabled=false;btn.textContent=sourceButton?originalButtonText:"🔊 Hear pronunciation";}
      toast("Recorded voice is unavailable; using the browser voice instead.");
    }
  }
  fallbackSpeech(text);
}

function fallbackSpeech(text) {
  if(!("speechSynthesis" in window)){toast("Speech playback is not supported in this browser.");return;}
  speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang="fil-PH";utterance.rate=0.78;utterance.pitch=1;
  const voices=speechSynthesis.getVoices();const filVoice=voices.find(v=>v.lang.toLowerCase().startsWith("fil"))||voices.find(v=>v.lang.toLowerCase().startsWith("tl"));if(filVoice)utterance.voice=filVoice;speechSynthesis.speak(utterance);
}

async function checkVoiceService() {
  const status=document.getElementById("voiceStatus");if(!status)return;
  if(!state.settings.naturalVoice){status.textContent="Recorded natural voices are turned off.";status.className="voice-status";return;}
  if(!location.protocol.startsWith("http")){status.textContent="Open the hosted app to use the recorded voice library. Browser voice is currently active.";status.className="voice-status warning";return;}
  const manifest=await loadStaticAudioManifest();
  if(manifest){
    const filCount=Object.keys(manifest.entries?.["fil-PH"]||{}).length;
    const enCount=Object.keys(manifest.entries?.["en-GB"]||{}).length;
    status.textContent=`Google voice library ready · ${filCount} Filipino + ${enCount} British English clips.`;
    status.className="voice-status ready";return;
  }
  try {
    const res=await fetch("/api/health",{cache:"no-store"});const data=await res.json();
    status.textContent=data.natural_voice?"Natural voice service is ready.":"Recorded voice library not found. Browser voice is active.";
    status.className=`voice-status ${data.natural_voice?"ready":"warning"}`;
  } catch {
    status.textContent="Recorded voice library not found. Browser voice is active.";status.className="voice-status warning";
  }
}

function toast(message) {const el=document.getElementById("toast");el.textContent=message;el.classList.remove("hidden");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.add("hidden"),3400);}

function progressPackage() {
  saveState();
  return {
    app:"Salita Quest",
    appVersion:APP_VERSION,
    schemaVersion:DATA_SCHEMA_VERSION,
    exportedAt:new Date().toISOString(),
    itemIdPolicy:"stable",
    data:state
  };
}

function exportProgress() {
  const blob=new Blob([JSON.stringify(progressPackage(),null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");
  a.href=url;a.download=`salita-quest-backup-v5-${todayKey()}.json`;a.click();URL.revokeObjectURL(url);
  toast("Progress backup downloaded.");
}

function applyImportedProgress(payload) {
  localStorage.setItem(`${STORAGE_KEY}.beforeImport`,JSON.stringify(state));
  state=migrateState(payload);
  saveState();updateAll();toast("Progress restored successfully.");
}

function importProgress(file) {
  const reader=new FileReader();reader.onload=()=>{try{applyImportedProgress(JSON.parse(reader.result));}catch(error){console.error(error);toast("That file is not a valid Salita Quest backup.");}};reader.readAsText(file);
}

function encodeTransferCode(payload) {
  const bytes=new TextEncoder().encode(JSON.stringify(payload));
  let binary="";bytes.forEach(byte=>binary+=String.fromCharCode(byte));
  return btoa(binary);
}

function decodeTransferCode(code) {
  const binary=atob(String(code||"").replace(/\s+/g,""));
  const bytes=Uint8Array.from(binary,char=>char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function copyTransferCode() {
  const code=encodeTransferCode(progressPackage());
  const input=document.getElementById("transferCodeInput");
  input.value=code;
  try{await navigator.clipboard.writeText(code);toast("Transfer code copied. Paste it into a future version or another device.");}
  catch{input.focus();input.select();toast("Transfer code created. Copy it from the box.");}
}

function restoreTransferCode() {
  const code=document.getElementById("transferCodeInput").value.trim();
  if(!code){toast("Paste a transfer code first.");return;}
  try{applyImportedProgress(decodeTransferCode(code));document.getElementById("transferCodeInput").value="";}
  catch(error){console.error(error);toast("That transfer code could not be read.");}
}

function updateTransferStatus() {
  const el=document.getElementById("transferStatus");if(!el)return;
  const saved=state.metadata?.savedAt||state.metadata?.migratedAt;
  el.textContent=`Data schema ${DATA_SCHEMA_VERSION} · ${Object.keys(state.itemState||{}).length} item records${saved?` · last saved ${new Date(saved).toLocaleString()}`:""}`;
}

function registerInstallSupport() {
  window.addEventListener("beforeinstallprompt",event=>{
    event.preventDefault();deferredInstallPrompt=event;
    document.getElementById("installAppBtn")?.classList.remove("hidden");
  });
  document.getElementById("installAppBtn")?.addEventListener("click",async()=>{
    if(!deferredInstallPrompt){toast("Use your browser menu and choose Install app or Add to Home Screen.");return;}
    deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;
    document.getElementById("installAppBtn")?.classList.add("hidden");
  });
  if("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("./service-worker.js").catch(error=>console.warn("Service worker registration failed",error));
  }
}

document.querySelectorAll("[data-view]").forEach(btn=>btn.addEventListener("click",()=>switchView(btn.dataset.view)));
document.getElementById("startDailyBtn").addEventListener("click",()=>startSession("daily"));
document.getElementById("quickReviewBtn").addEventListener("click",()=>{
  const length=Number(document.getElementById("homeQuickReviewLength")?.value||state.settings.quickReviewLength||4);
  startSession("quick",false,{length});
});
document.getElementById("activityDailyBtn")?.addEventListener("click",()=>startSession("daily"));
document.getElementById("activityQuickBtn")?.addEventListener("click",()=>{const el=document.getElementById("activityQuickLength");const length=Number(el?.value||state.settings.quickReviewLength||4);startSession("quick",false,{length});});
document.getElementById("activityQuickLength")?.addEventListener("change",e=>{state.settings.quickReviewLength=Number(e.target.value);const old=document.getElementById("homeQuickReviewLength");if(old)old.value=e.target.value;saveState();syncSettings();});
document.getElementById("handsFreePlayBtn")?.addEventListener("click",startHandsFreeReview);
document.getElementById("handsFreePauseBtn")?.addEventListener("click",toggleHandsFreePause);
document.getElementById("handsFreeStopBtn")?.addEventListener("click",()=>stopHandsFreeReview());
document.getElementById("handsFreeNewMixBtn")?.addEventListener("click",()=>buildHandsFreeQueue({advance:true}));
document.getElementById("checkBtn").addEventListener("click",checkAnswer);
document.getElementById("nextBtn").addEventListener("click",nextExercise);
document.getElementById("skipBtn").addEventListener("click",()=>{if(!session)return;session.combo=0;session.index++;session.boss?loadBossExercise():loadExercise();});
document.getElementById("hintBtn").addEventListener("click",()=>{if(currentExercise)document.getElementById("hintText").textContent=currentExercise.hint;});
document.getElementById("audioBtn").addEventListener("click",e=>speakFilipino(e.currentTarget.dataset.text,e.currentTarget));
document.getElementById("undoWordBtn").addEventListener("click",undoBuilderWord);
document.getElementById("clearWordsBtn").addEventListener("click",clearBuilderWords);
document.getElementById("startBossBtn").addEventListener("click",()=>startSession("boss",true));
document.getElementById("answerInput").addEventListener("keydown",e=>{if(e.key==="Enter"){if(!document.getElementById("nextBtn").classList.contains("hidden"))nextExercise();else checkAnswer();}});

document.getElementById("beginnerSetting").addEventListener("change",e=>{state.settings.beginnerMode=e.target.checked;if(e.target.checked){state.settings.newItems=2;state.settings.sessionLength=8;state.settings.preferProduction=false;}saveState();updateAll();});
document.getElementById("newItemsSetting").addEventListener("change",e=>{state.settings.newItems=Number(e.target.value);saveState();updateAll();});
document.getElementById("sessionLengthSetting").addEventListener("change",e=>{state.settings.sessionLength=Number(e.target.value);saveState();});
document.getElementById("quickReviewLengthSetting").addEventListener("change",e=>{state.settings.quickReviewLength=Number(e.target.value);document.getElementById("homeQuickReviewLength").value=e.target.value;const activity=document.getElementById("activityQuickLength");if(activity)activity.value=e.target.value;saveState();});
document.getElementById("homeQuickReviewLength").addEventListener("change",e=>{state.settings.quickReviewLength=Number(e.target.value);const activity=document.getElementById("activityQuickLength");if(activity)activity.value=e.target.value;saveState();syncSettings();});
document.getElementById("strictSetting").addEventListener("change",e=>{state.settings.strict=e.target.checked;saveState();});
document.getElementById("productionSetting").addEventListener("change",e=>{state.settings.preferProduction=e.target.checked;saveState();});
document.getElementById("naturalVoiceSetting").addEventListener("change",e=>{state.settings.naturalVoice=e.target.checked;saveState();checkVoiceService();});
document.getElementById("celebrationSoundSetting").addEventListener("change",e=>{state.settings.celebrationSounds=e.target.checked;saveState();});
document.getElementById("reducedMotionSetting").addEventListener("change",e=>{state.settings.reducedMotion=e.target.checked;saveState();applyDisplaySettings();});
document.getElementById("darkModeSetting").addEventListener("change",e=>{state.settings.darkMode=e.target.checked;saveState();applyDisplaySettings();});
document.getElementById("exportBtn").addEventListener("click",exportProgress);
document.getElementById("importInput").addEventListener("change",e=>{if(e.target.files[0])importProgress(e.target.files[0]);e.target.value="";});
document.getElementById("copyTransferBtn").addEventListener("click",copyTransferCode);
document.getElementById("restoreTransferBtn").addEventListener("click",restoreTransferCode);
document.getElementById("resetBtn").addEventListener("click",()=>{const ok=confirm("Reset all Salita Quest progress? This cannot be undone unless you exported a backup.");if(!ok)return;state=structuredClone(DEFAULT_STATE);saveState();updateAll();toast("Progress reset.");});


document.getElementById("homeTopicShortBtn").addEventListener("click",()=>startTopicReview(document.getElementById("homeTopicSelect").value,"sample",5));
document.getElementById("homeTopicAllBtn").addEventListener("click",()=>startTopicReview(document.getElementById("homeTopicSelect").value,"all-learned"));
document.getElementById("dictionarySearch").addEventListener("input",renderDictionary);
document.getElementById("dictionaryModuleFilter").addEventListener("change",renderDictionary);
document.getElementById("dictionaryOriginFilter").addEventListener("change",renderDictionary);
document.getElementById("dictionaryMode").addEventListener("change",()=>{dictionaryRevealIds.clear();renderDictionary();});
document.getElementById("dictionaryRandomBtn").addEventListener("click",openRandomDictionaryCard);

document.getElementById("closeDialogueBtn").addEventListener("click",closeDialogue);
document.getElementById("dialogueModal").addEventListener("click",e=>{
  if(e.target.id==="dialogueModal")closeDialogue();
});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape" && !document.getElementById("dialogueModal").classList.contains("hidden"))closeDialogue();
  if(e.key==="Escape" && !document.getElementById("sessionCompleteModal").classList.contains("hidden"))closeSessionComplete("home");
});


document.getElementById("sessionHomeBtn")?.addEventListener("click",()=>closeSessionComplete("home"));
document.getElementById("sessionReviewBtn")?.addEventListener("click",()=>{document.getElementById("sessionCompleteModal").classList.add("hidden");document.body.classList.remove("modal-open");startSession("quick",false,{length:state.settings.quickReviewLength||4});});
document.getElementById("mobileMenuBtn")?.addEventListener("click",openMobileMenu);
document.getElementById("mobileMenuCloseBtn")?.addEventListener("click",closeMobileMenu);
document.getElementById("mobileMenuBackdrop")?.addEventListener("click",closeMobileMenu);
document.getElementById("mobileImportBtn")?.addEventListener("click",()=>document.getElementById("importInput")?.click());
document.getElementById("mobileSheetImportBtn")?.addEventListener("click",()=>{closeMobileMenu();switchView("settings");setTimeout(()=>document.getElementById("importInput")?.click(),150);});
document.getElementById("mobileExitLessonBtn")?.addEventListener("click",()=>{
  if(!session){switchView("home");return;}
  const leave=confirm("Leave this lesson? Your completed answers are already saved.");
  if(leave){session=null;currentExercise=null;switchView("home");updateAll();}
});

registerInstallSupport();
updateAll();


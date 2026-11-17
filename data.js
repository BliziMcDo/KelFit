/* Données du programme : exercices, séances, phases, plan de course. */

const MUSCLES = {
  pecs: 'Pectoraux', delts: 'Épaules', reardelts: 'Arrière d’épaules', biceps: 'Biceps', triceps: 'Triceps',
  forearms: 'Avant-bras', abs: 'Abdominaux', obliques: 'Obliques', quads: 'Quadriceps', hams: 'Ischio-jambiers',
  glutes: 'Fessiers', calves: 'Mollets', traps: 'Trapèzes', lats: 'Dorsaux', lowerback: 'Lombaires',
};

/* start = charge de départ (kg) calibrée pour la phase 1 ; inc = palier d'augmentation ;
   est = estimation (pas de référence récente dans l'historique) ; bw = poids du corps (charge = lest) ;
   hand = charge par haltère. */
const EX = {
  bench:     { n: 'Développé couché barre', img: 'Barbell_Bench_Press_-_Medium_Grip', p: ['pecs'], s: ['delts', 'triceps'], start: 57.5, inc: 2.5,
               cue: 'Omoplates serrées, pieds ancrés. Descends la barre en 2 secondes jusqu’à la poitrine, sans rebond.' },
  latpull:   { n: 'Tirage vertical prise large', img: 'Wide-Grip_Lat_Pulldown', p: ['lats'], s: ['biceps', 'reardelts'], start: 59, inc: 7,
               cue: 'Tire les coudes vers les hanches, poitrine sortie. Contrôle la remontée, bras presque tendus en haut.' },
  inclinedb: { n: 'Développé incliné haltères', img: 'Incline_Dumbbell_Press', p: ['pecs', 'delts'], s: ['triceps'], start: 18, inc: 2, hand: true,
               cue: 'Banc à 30°. Étirement complet en bas, haltères qui se rapprochent en haut sans se toucher.' },
  cablerow:  { n: 'Tirage horizontal poulie', img: 'Seated_Cable_Rows', p: ['lats', 'traps'], s: ['biceps', 'reardelts'], start: 52, inc: 7,
               cue: 'Buste fixe, tire vers le nombril en serrant les omoplates une seconde.' },
  latraise:  { n: 'Élévations latérales haltères', img: 'Side_Lateral_Raise', p: ['delts'], s: ['traps'], start: 7, inc: 1, hand: true,
               cue: 'Coudes légèrement fléchis, monte jusqu’à l’horizontale, sans élan. Descente freinée.' },
  skull:     { n: 'Barre au front', img: 'EZ-Bar_Skullcrusher', p: ['triceps'], s: [], start: 25, inc: 2.5,
               cue: 'Coudes fixes pointés vers le plafond, descends la barre derrière le front pour étirer le triceps.' },
  preacher:  { n: 'Curl pupitre', img: 'Preacher_Curl', p: ['biceps'], s: ['forearms'], start: 27.5, inc: 2.5,
               cue: 'Extension presque complète en bas, sans décoller les bras du pupitre.' },

  squat:     { n: 'Squat barre', img: 'Barbell_Squat', p: ['quads', 'glutes'], s: ['hams', 'lowerback', 'abs'], start: 50, inc: 2.5,
               cue: 'Descends au moins jusqu’à la parallèle, genoux dans l’axe des pieds, dos gainé.' },
  rdl:       { n: 'Soulevé de terre roumain', img: 'Romanian_Deadlift', p: ['hams', 'glutes'], s: ['lowerback', 'forearms'], start: 50, inc: 5, est: true,
               cue: 'Recule les hanches, dos plat, barre contre les cuisses. Arrête quand les ischios sont bien étirés.' },
  legext:    { n: 'Leg extension', img: 'Leg_Extensions', p: ['quads'], s: [], start: 40, inc: 5, est: true,
               cue: 'Marque une seconde jambes tendues, redescends en 2 à 3 secondes.' },
  seatcurl:  { n: 'Leg curl assis', img: 'Seated_Leg_Curl', p: ['hams'], s: ['calves'], start: 30, inc: 5, est: true,
               cue: 'Bassin calé au fond du siège, flexion complète, retour contrôlé.' },
  standcalf: { n: 'Mollets debout', img: 'Standing_Calf_Raises', p: ['calves'], s: [], start: 40, inc: 5, est: true,
               cue: 'Étirement complet en bas (2 secondes), montée maximale sur la pointe.' },
  cablecrunch:{ n: 'Crunch à la poulie', img: 'Cable_Crunch', p: ['abs'], s: ['obliques'], start: 36, inc: 2.5,
               cue: 'Enroule la colonne, les hanches ne bougent pas. Souffle en contractant.' },

  dbpress:   { n: 'Développé épaules haltères', img: 'Dumbbell_Shoulder_Press', p: ['delts'], s: ['triceps', 'traps'], start: 16, inc: 2, hand: true,
               cue: 'Assis, dos calé. Descends les haltères au niveau des oreilles, pousse sans cambrer.' },
  pullup:    { n: 'Tractions', img: 'Pullups', p: ['lats'], s: ['biceps', 'reardelts', 'forearms'], start: 0, inc: 2.5, bw: true,
               cue: 'Départ bras tendus, menton au-dessus de la barre. Ajoute du lest quand le haut de la fourchette est atteint.' },
  butterfly: { n: 'Pec fly machine', img: 'Butterfly', p: ['pecs'], s: ['delts'], start: 45, inc: 7,
               cue: 'Coudes légèrement fléchis, grand étirement à l’ouverture, contraction d’une seconde.' },
  dbrow:     { n: 'Rowing haltère un bras', img: 'One-Arm_Dumbbell_Row', p: ['lats'], s: ['traps', 'biceps', 'reardelts'], start: 22, inc: 2, hand: true, est: true,
               cue: 'Dos plat, tire le coude vers la hanche. Même nombre de répétitions de chaque côté.' },
  facepull:  { n: 'Face pull', img: 'Face_Pull', p: ['reardelts'], s: ['traps'], start: 18, inc: 2.5,
               cue: 'Corde tirée vers le front, coudes hauts, rotation externe en fin de mouvement.' },
  pushdown:  { n: 'Extension triceps à la corde', img: 'Triceps_Pushdown_-_Rope_Attachment', p: ['triceps'], s: [], start: 14, inc: 2.5,
               cue: 'Coudes collés au corps, écarte la corde en bas, remontée lente.' },
  hammer:    { n: 'Curl marteau', img: 'Hammer_Curls', p: ['biceps', 'forearms'], s: [], start: 12, inc: 2, hand: true, est: true,
               cue: 'Prise neutre, coudes fixes, pas de balancement du buste.' },

  legpress:  { n: 'Presse à cuisses', img: 'Leg_Press', p: ['quads', 'glutes'], s: ['hams'], start: 80, inc: 10,
               cue: 'Descends profondément sans décoller le bassin, ne verrouille pas les genoux en haut.' },
  hipthrust: { n: 'Hip thrust barre', img: 'Barbell_Hip_Thrust', p: ['glutes'], s: ['hams'], start: 50, inc: 5, est: true,
               cue: 'Menton rentré, pousse dans les talons, contraction de 2 secondes en haut.' },
  lunge:     { n: 'Fentes haltères', img: 'Dumbbell_Lunges', p: ['quads', 'glutes'], s: ['hams'], start: 12, inc: 2, hand: true, est: true,
               cue: 'Grand pas, genou arrière qui frôle le sol, buste droit. Répétitions par jambe.' },
  lyingcurl: { n: 'Leg curl allongé', img: 'Lying_Leg_Curls', p: ['hams'], s: ['calves'], start: 30, inc: 5, est: true,
               cue: 'Hanches plaquées, amène le boudin aux fessiers, retour en 3 secondes.' },
  seatcalf:  { n: 'Mollets assis', img: 'Seated_Calf_Raise', p: ['calves'], s: [], start: 30, inc: 5, est: true,
               cue: 'Amplitude complète, pause en bas et en haut.' },
  legraise:  { n: 'Relevé de jambes suspendu', img: 'Hanging_Leg_Raise', p: ['abs'], s: ['obliques', 'forearms'], start: 0, inc: 2.5, bw: true,
               cue: 'Sans balancer, enroule le bassin pour monter les jambes. Genoux fléchis si besoin.' },
};

/* Séances de musculation : [exercice, rôle, superset]. Superset : 'a' s'enchaîne sans repos avec le suivant ('b').
   Rôles : main (principal), comp (complémentaire), acc (accessoire). */
const SESSIONS = {
  HA: { name: 'Haut A', sub: 'Pectoraux et dos',
        ex: [['bench', 'main'], ['latpull', 'main'], ['inclinedb', 'comp'], ['cablerow', 'comp'], ['latraise', 'acc'], ['skull', 'acc', 'a'], ['preacher', 'acc', 'b']] },
  BA: { name: 'Bas A', sub: 'Quadriceps',
        ex: [['squat', 'main'], ['rdl', 'comp'], ['legext', 'acc'], ['seatcurl', 'acc'], ['standcalf', 'acc'], ['cablecrunch', 'acc']] },
  HB: { name: 'Haut B', sub: 'Épaules et dos',
        ex: [['dbpress', 'main'], ['pullup', 'main'], ['butterfly', 'comp'], ['dbrow', 'comp'], ['facepull', 'acc'], ['pushdown', 'acc', 'a'], ['hammer', 'acc', 'b']] },
  BB: { name: 'Bas B', sub: 'Ischios et fessiers',
        ex: [['legpress', 'main'], ['hipthrust', 'comp'], ['lunge', 'comp'], ['lyingcurl', 'acc'], ['seatcalf', 'acc'], ['legraise', 'acc']] },
};
/* Semaine type : jour 0 = premier jour du programme (lundi). Course mardi et jeudi, musculation mercredi, vendredi,
   samedi et dimanche, footing optionnel le samedi. Chaque séance peut être déplacée dans l'application. */
const WEEK_ORDER = [['Q', 1], ['HA', 2], ['E', 3], ['BA', 4], ['HB', 5], ['O', 5], ['BB', 6]];
const RUN_O_KM = 6;

const PHASES = {
  1: { name: 'Relance', weeks: 'Semaines 1 à 4',
       goal: 'Remettre en place une progression régulière, rééquilibrer les jambes et installer la routine de quatre séances.',
       effort: 'Garde 2 répétitions en réserve sur chaque série.',
       run: 'Fractionné court pour réveiller la vitesse, footing facile.' },
  2: { name: 'Volume', weeks: 'Semaines 5 à 8',
       goal: 'Augmenter le nombre de séries par muscle : c’est la phase qui construit le plus de muscle.',
       effort: 'Garde 1 répétition en réserve ; la dernière série peut aller au bout. Repos plus courts pour tenir dans la séance.',
       run: 'Travail au seuil pour tenir une allure soutenue plus longtemps.' },
  3: { name: 'Intensité', weeks: 'Semaines 9 à 12',
       goal: 'Transformer le volume en charges plus lourdes sur les gros exercices, puis tester en semaine 12.',
       effort: 'Séries lourdes, 1 répétition en réserve. Technique irréprochable.',
       run: 'Allure spécifique 10 km, puis test chronométré en semaine 12.' },
};

/* Prescription par phase et par rôle : séries, fourchette de répétitions, repos (secondes). */
const RULES = {
  1: { main: { sets: 3, lo: 8, hi: 10, rest: 150 }, comp: { sets: 3, lo: 10, hi: 12, rest: 120 }, acc: { sets: 3, lo: 12, hi: 15, rest: 75 } },
  2: { main: { sets: 4, lo: 8, hi: 10, rest: 120 }, comp: { sets: 4, lo: 10, hi: 12, rest: 90 }, acc: { sets: 3, lo: 12, hi: 15, rest: 60 } },
  3: { main: { sets: 4, lo: 5, hi: 7, rest: 165 }, comp: { sets: 3, lo: 8, hi: 10, rest: 105 }, acc: { sets: 3, lo: 10, hi: 12, rest: 60 } },
};
/* Durée estimée : 5 min d'échauffement, 45 s par série, 1 min 30 de transition par exercice. */
const WARMUP_SEC = 300, SET_SEC = 45, MOVE_SEC = 90;
const ROLE_LABEL = { main: 'Principal', comp: 'Complémentaire', acc: 'Accessoire' };

/* Séance de qualité en course, par semaine. pace : vma | p800 | seuil | cible. dist en mètres, rec en secondes. */
const RUN_Q = {
  1:  { title: 'Fractionné court', reps: 8,  dist: 400,  pace: 'vma',   rec: 75 },
  2:  { title: 'Fractionné court', reps: 10, dist: 400,  pace: 'vma',   rec: 75 },
  3:  { title: 'Fractionné moyen', reps: 6,  dist: 800,  pace: 'p800',  rec: 120 },
  4:  { title: 'Rappel de vitesse', reps: 6, dist: 400,  pace: 'vma',   rec: 90 },
  5:  { title: 'Seuil',            reps: 3,  dist: 2000, pace: 'seuil', rec: 120 },
  6:  { title: 'Seuil',            reps: 4,  dist: 2000, pace: 'seuil', rec: 90 },
  7:  { title: 'Seuil long',       reps: 2,  dist: 3000, pace: 'seuil', rec: 180 },
  8:  { title: 'Seuil léger',      reps: 3,  dist: 1000, pace: 'seuil', rec: 90 },
  9:  { title: 'Allure 10 km',     reps: 5,  dist: 1000, pace: 'cible', rec: 120 },
  10: { title: 'Allure 10 km',     reps: 6,  dist: 1000, pace: 'cible', rec: 120 },
  11: { title: 'Allure 10 km',     reps: 3,  dist: 2000, pace: 'cible', rec: 150 },
  12: { title: 'Déblocage',        reps: 5,  dist: 400,  pace: 'cible', rec: 90 },
};
/* Footing : distance en km par semaine. La semaine 12 est le test 10 km. */
const RUN_E = { 1: 8, 2: 9, 3: 10, 4: 7, 5: 10, 6: 11, 7: 12, 8: 8, 9: 10, 10: 11, 11: 9, 12: 10 };
const PACE_LABEL = { vma: 'Allure rapide', p800: 'Allure soutenue', seuil: 'Allure seuil', cible: 'Allure 10 km visée' };
const TOTAL_WEEKS = 12;

# Mettre KelFit en ligne avec GitHub — tutoriel pas à pas

Les mots **en gras** sont les termes exacts affichés sur le site GitHub (en anglais).

## À quoi sert GitHub ici

- **GitHub** est un site qui stocke des dossiers de code, appelés **repositories** (« dépôts », souvent abrégé « repo »).
- **GitHub Pages** est un service gratuit de GitHub qui transforme un dépôt en site web. C'est lui qui donnera à KelFit une adresse utilisable sur ton iPhone.
- Ton compte : `BliziMcDo`. L'adresse finale sera `https://blizimcdo.github.io/kelfit/`.

Ce qui est publié : le code de l'application et les photos d'exercices. Ce qui ne l'est pas : `Historique Muscu.txt` et les séances que tu saisis (elles restent sur ton téléphone).

## Étape 1 — Se connecter

1. Ouvre https://github.com dans ton navigateur.
2. Clique sur **Sign in** en haut à droite.
3. Saisis ton **Username or email address** et ton **Password**, puis **Sign in**.
4. Si GitHub demande un code de vérification (**Device verification**), il t'est envoyé par e-mail.

## Étape 2 — Créer le dépôt

1. Clique sur le **+** en haut à droite, puis **New repository** (ou ouvre https://github.com/new).
2. **Owner** : laisse `BliziMcDo`.
3. **Repository name** : tape `kelfit` (en minuscules, sans espace).
4. **Description** : facultatif.
5. Choisis **Public**. GitHub Pages gratuit ne fonctionne pas avec **Private**.
6. Ne coche rien d'autre : pas de **Add a README file**, **Add .gitignore** sur « None », **Choose a license** sur « None ». Le dépôt doit être vide.
7. Clique sur **Create repository**.

Tu arrives sur une page intitulée **Quick setup**, avec des lignes de commande : ne fais rien de plus, c'est moi qui envoie les fichiers. Dis-moi simplement « c'est créé ».

## Étape 3 — Autoriser l'envoi depuis ton PC

Quand j'envoie les fichiers (l'opération s'appelle un **push**), une fenêtre **Connect to GitHub** s'ouvre sur ton PC.

1. Clique sur **Sign in with your browser**.
2. Dans la page qui s'ouvre, clique sur **Authorize git-ecosystem**.
3. Si demandé, confirme ton mot de passe (**Confirm access**).
4. Un message **Authentication Succeeded** s'affiche : tu peux fermer l'onglet.

C'est à faire une seule fois ; ton PC s'en souvient ensuite.

## Étape 4 — Activer GitHub Pages

1. Ouvre https://github.com/BliziMcDo/kelfit. Tu dois voir la liste des fichiers (`index.html`, `app.js`, …).
2. Clique sur l'onglet **Settings** (roue dentée, dans la barre du dépôt, tout à droite).
3. Dans le menu de gauche, rubrique **Code and automation**, clique sur **Pages**.
4. Sous **Build and deployment**, à **Source**, choisis **Deploy from a branch**.
5. Sous **Branch**, remplace **None** par **main**, laisse le dossier sur **/ (root)**, puis clique sur **Save**.
6. Patiente 1 à 2 minutes et recharge la page. Un encadré apparaît en haut : **Your site is live at** `https://blizimcdo.github.io/kelfit/`, avec un bouton **Visit site**.

Pour suivre la publication : onglet **Actions**, ligne **pages build and deployment**. Rond jaune = en cours, coche verte = publié, croix rouge = échec (dis-le-moi).

## Étape 5 — Installer sur l'iPhone

1. Sur l'iPhone, ouvre **Safari** (pas Chrome) à l'adresse `https://blizimcdo.github.io/kelfit/`.
2. Touche le bouton **Partager** (carré avec une flèche vers le haut).
3. Choisis **Sur l'écran d'accueil**, puis **Ajouter**.
4. Lance KelFit depuis son icône « KF ». Après la première ouverture, elle fonctionne aussi sans réseau.

## Mode d'emploi du site GitHub

| Terme sur le site | Ce que c'est |
|---|---|
| **Repository** (repo) | Le dossier du projet en ligne. |
| **Code** (onglet) | La liste des fichiers publiés. |
| **Commit** | Une sauvegarde datée d'un ensemble de modifications, avec un message. |
| **Commits** (lien avec une horloge) | L'historique de toutes les sauvegardes. |
| **Branch** / **main** | Une version du projet ; `main` est la version principale, celle qui est publiée. |
| **Push** | Envoyer les commits du PC vers GitHub. |
| **Actions** (onglet) | Le journal des publications automatiques du site. |
| **Settings** (onglet) | Les réglages du dépôt ; **Pages** s'y trouve. |
| **Issues**, **Pull requests** | Outils de travail en équipe : inutiles pour toi. |
| **Public** / **Private** | Visible par tous ceux qui ont l'adresse / visible par toi seul. |

### Mettre l'application à jour

Quand je modifie l'application, j'enregistre un **commit** puis je fais un **push**. GitHub republie le site tout seul en 1 à 2 minutes. Sur l'iPhone, ferme KelFit puis rouvre-la deux fois pour charger la nouvelle version. Tes séances saisies sont conservées.

### Vérifier qu'une mise à jour est arrivée

Sur la page du dépôt, au-dessus de la liste des fichiers, la dernière ligne indique le message du dernier commit et son ancienneté (« 2 minutes ago »). Une coche verte à côté signifie que le site est republié.

### Supprimer le site

**Settings** → tout en bas, **Danger Zone** → **Delete this repository**. Le site disparaît ; les fichiers sur ton PC ne sont pas touchés.

### En cas de problème

- **Page 404 « There isn't a GitHub Pages site here »** : Pages n'est pas activé (étape 4) ou la publication n'est pas terminée ; attends 2 minutes.
- **Le bouton Save de Pages est grisé** : le dépôt est en **Private** ; passe-le en **Public** dans **Settings** → **General** → **Danger Zone** → **Change repository visibility**.
- **Mot de passe oublié** : sur la page **Sign in**, clique sur **Forgot password?**.

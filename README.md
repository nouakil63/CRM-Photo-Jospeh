# CRM Photo — Académie Delaveau Photo

CRM pour le photographe Joseph : suivi des académiciens et de leurs paiements
(qui a payé, combien, quand), avec enregistrement automatique des paiements
Stripe via webhook.

## Fonctionnement

- **Tableau de bord** : liste des académiciens avec total payé, montant
  attendu, dernier paiement et statut (À jour / Partiel / En attente).
- **Fiche académicien** : coordonnées, historique des paiements, ajout de
  paiements manuels (espèces, chèque, virement).
- **Stripe automatique** : chaque paiement Stripe est poussé par webhook et
  associé à l'académicien via son **email**. Si l'email ne correspond à
  personne, le paiement apparaît dans « Paiements non associés » sur le
  tableau de bord, à associer en un clic.

## Stack

Next.js (App Router) · Supabase (base + auth) · Stripe (webhook) · Tailwind CSS.
Hébergement recommandé : Vercel (plan gratuit suffisant).

## Mise en place (une seule fois)

### 1. Supabase

1. Créer un projet sur [supabase.com](https://supabase.com) (gratuit).
2. SQL Editor → coller le contenu de `supabase/migrations/0001_init.sql` → Run.
3. Authentication → Users → **Add user** : créer le compte de Joseph
   (email + mot de passe). Pas de page d'inscription : c'est voulu, lui seul
   a accès.
4. Project Settings → API : noter l'URL, la clé `anon` et la clé
   `service_role`.

### 2. Déploiement Vercel

1. Importer ce dépôt GitHub sur [vercel.com](https://vercel.com).
2. Renseigner les variables d'environnement de `.env.example`
   (`STRIPE_WEBHOOK_SECRET` viendra à l'étape 3).
3. Déployer → noter l'URL, ex. `https://crm-photo-joseph.vercel.app`.

### 3. Stripe

1. Dashboard Stripe → Développeurs → Webhooks → **Ajouter un endpoint** :
   - URL : `https://<votre-domaine>/api/stripe/webhook`
   - Événements : `checkout.session.completed` et `charge.refunded`.
2. Copier le « Secret de signature » (`whsec_...`) dans la variable
   `STRIPE_WEBHOOK_SECRET` sur Vercel, puis redéployer.
3. Pour encaisser : créer des **Payment Links** dans Stripe (Produits →
   Liens de paiement) et les envoyer aux parents. Aucun code à écrire.

> **Important** : l'association automatique se fait par email. L'email saisi
> lors du paiement Stripe doit être le même que celui de la fiche
> académicien. Sinon le paiement arrive quand même, mais dans « Paiements
> non associés ».

## Développement local

```bash
npm install
cp .env.example .env.local   # remplir les valeurs
npm run dev
```

Pour tester le webhook en local :

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Lien avec le site de l'académie (autre dépôt)

Utiliser **le même projet Supabase** pour le site de l'académie : la table
`students` servira de base aux comptes élèves, et les photos privées iront
dans Supabase Storage (bucket privé + URLs signées). Un seul endroit à
maintenir, pas de synchronisation entre deux bases.

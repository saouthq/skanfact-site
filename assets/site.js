/* =============================================================================
   SkanFact — le peu de JavaScript dont le site a besoin.
   Règle de conduite : la page doit être entièrement lisible et utilisable sans
   ce fichier. Il n'ajoute que du confort — et la dernière version publiée.
   ============================================================================= */
(function () {
  'use strict';

  var DEPOT = 'saouthq/skanfact';
  var RELEASES = 'https://github.com/' + DEPOT + '/releases';

  /* ------------------------------------------------- la page où l'on se trouve
     Marquée ici plutôt qu'à la main dans dix fichiers : une seule vérité, et
     aucune page ne peut oublier de se signaler. */
  var ici = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  Array.prototype.forEach.call(document.querySelectorAll('.nav-site a, .panneau a'), function (a) {
    var cible = (a.getAttribute('href') || '').split('#')[0].split('/').pop().toLowerCase();
    if (cible && cible === ici && !a.classList.contains('btn')) {
      a.setAttribute('aria-current', 'page');
      var sous = a.closest('.sous');
      if (sous) sous.classList.add('actif');
    }
  });

  /* ------------------------------------------- le menu « Fonctionnalités »
     Sous 900 px il est déplié dans le panneau du burger : la CSS s'en charge,
     et ce bouton n'existe plus. */
  var sousFonc = document.getElementById('sous-fonc');
  var btnFonc = document.getElementById('btn-fonc');
  if (sousFonc && btnFonc) {
    var fermerSous = function () {
      sousFonc.classList.remove('ouvert');
      btnFonc.setAttribute('aria-expanded', 'false');
    };
    btnFonc.addEventListener('click', function (e) {
      e.stopPropagation();
      var ouvert = sousFonc.classList.toggle('ouvert');
      btnFonc.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    });
    // Un menu qui ne se referme pas ailleurs reste en travers du contenu.
    document.addEventListener('click', function (e) {
      if (!sousFonc.contains(e.target)) fermerSous();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sousFonc.classList.contains('ouvert')) {
        fermerSous();
        btnFonc.focus();
      }
    });
  }

  /* ------------------------------------------------------------- le menu */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav-site');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var ouvert = nav.classList.toggle('ouvert');
      burger.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
      burger.setAttribute('aria-label', ouvert ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    // Un menu qui reste ouvert après le clic cache la section où l'on vient d'aller.
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('ouvert');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('ouvert')) {
        nav.classList.remove('ouvert');
        burger.setAttribute('aria-expanded', 'false');
        burger.focus();
      }
    });
  }

  /* -------------------------------------------------- l'en-tête qui se pose */
  var entete = document.getElementById('entete');
  if (entete) {
    var poser = function () { entete.classList.toggle('collee', window.scrollY > 8); };
    poser();
    window.addEventListener('scroll', poser, { passive: true });
  }

  /* --------------------------------------------------- le formulaire de contact
     Pas de serveur : le bouton prépare un email. C'est honnête et ça marche
     partout — l'adresse est aussi écrite en clair juste à côté, pour qui n'a pas
     de logiciel de messagerie configuré. */
  var form = document.getElementById('form-contact');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var manquant = null;
      ['nom', 'email', 'message'].forEach(function (id) {
        var champ = document.getElementById(id);
        if (champ && !champ.value.trim() && !manquant) manquant = champ;
      });
      if (manquant) {
        // On MONTRE le champ refusé au lieu d'afficher un message au-dessus du vide.
        manquant.scrollIntoView({ block: 'center', behavior: 'smooth' });
        manquant.focus();
        manquant.style.borderColor = '#e8a33d';
        return;
      }
      var v = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
      var profil = (form.querySelector('input[name="profil"]:checked') || {}).value || 'une entreprise';
      var corps = [
        'Je suis ' + profil + '.',
        '',
        'Nom : ' + v('nom'),
        'Société : ' + (v('societe') || '—'),
        'Email : ' + v('email'),
        'Téléphone : ' + (v('tel') || '—'),
        '',
        v('message')
      ].join('\n');
      window.location.href = 'mailto:contact@skanfact.tn'
        + '?subject=' + encodeURIComponent('SkanFact — demande de ' + v('nom'))
        + '&body=' + encodeURIComponent(corps);
    });
  }

  /* ------------------------------------------------- la dernière version publiée
     Le dépôt est public : l'API GitHub répond sans jeton. Si elle ne répond pas
     (quota, hors ligne), rien ne casse — les liens de repli mènent à la page des
     versions, et les numéros écrits dans la page restent affichés. */
  function reperer(assets, cabinet, extension) {
    for (var i = 0; i < assets.length; i++) {
      var n = assets[i].name || '';
      if (/\.blockmap$/.test(n)) continue;
      var estCabinet = /^SkanFact-Cabinet-/i.test(n);
      if (estCabinet !== cabinet) continue;
      if (n.slice(-extension.length).toLowerCase() === extension) return assets[i];
    }
    return null;
  }

  function poids(octets) {
    if (!octets) return '';
    return Math.round(octets / 1048576) + ' Mo';
  }

  var pageTele = document.getElementById('telechargement');

  fetch('https://api.github.com/repos/' + DEPOT + '/releases/latest', {
    headers: { Accept: 'application/vnd.github+json' }
  })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (rel) {
      var version = (rel.tag_name || '').replace(/^v/, '');
      var assets = rel.assets || [];

      Array.prototype.forEach.call(document.querySelectorAll('[data-version]'), function (el) {
        if (version) el.textContent = version;
      });

      if (!pageTele) return;

      var date = rel.published_at ? new Date(rel.published_at) : null;
      var etat = document.getElementById('etat-version');
      if (etat && version) {
        etat.innerHTML = 'Dernière version : <b>' + version + '</b>'
          + (date ? ' · publiée le ' + date.toLocaleDateString('fr-FR') : '');
      }

      [
        { cle: 'mac', cabinet: false, ext: '.dmg' },
        { cle: 'win', cabinet: false, ext: '.exe' },
        { cle: 'cab-mac', cabinet: true, ext: '.dmg' },
        { cle: 'cab-win', cabinet: true, ext: '.exe' }
      ].forEach(function (c) {
        var a = reperer(assets, c.cabinet, c.ext);
        var lien = document.querySelector('[data-tele="' + c.cle + '"]');
        var nom = document.querySelector('[data-fichier="' + c.cle + '"]');
        if (a && lien) lien.href = a.browser_download_url;
        if (a && nom) nom.textContent = a.name + ' · ' + poids(a.size);
      });
    })
    .catch(function () {
      var etat = document.getElementById('etat-version');
      if (etat) {
        etat.innerHTML = 'La liste des versions n\'a pas pu être chargée. '
          + '<a href="' + RELEASES + '" rel="noopener">Ouvrir la page des versions</a>';
      }
    });

  /* --------------------------------------- mettre en avant le bon système
     On ne cache jamais l'autre : quelqu'un télécharge souvent pour un collègue. */
  if (pageTele) {
    var p = navigator.platform || '';
    var ua = navigator.userAgent || '';
    var estMac = /Mac/i.test(p) || /Mac OS X/i.test(ua);
    var estWin = /Win/i.test(p) || /Windows/i.test(ua);
    var cible = estMac ? 'mac' : (estWin ? 'win' : null);
    if (cible) {
      var carte = document.querySelector('[data-carte="' + cible + '"]');
      if (carte) {
        carte.classList.add('conseille');
        var repere = carte.querySelector('[data-repere]');
        if (repere) repere.textContent = 'Votre système';
      }
    }
  }
})();

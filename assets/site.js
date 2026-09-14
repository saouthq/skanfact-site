/* =============================================================================
   SkanFact — le peu de JavaScript dont le site a besoin.
   Règle de conduite : la page doit être entièrement lisible et utilisable sans
   ce fichier. Il n'ajoute que du confort — et la dernière version publiée.
   ============================================================================= */
(function () {
  'use strict';

  var DEPOT = 'saouthq/skanfact';
  var RELEASES = 'https://github.com/' + DEPOT + '/releases';

  /* L'adresse du relais qui remet les messages du formulaire — le MÊME worker Cloudflare que
     celui des mises à jour, avec une route `/contact` en plus. Tant que cette ligne est vide,
     ou si le relais ne répond pas, le formulaire repasse par le logiciel de messagerie du
     visiteur : on ne perd jamais un message parce qu'un service est en panne.
     Une seule ligne à remplir : voir worker/README.md dans le dépôt de l'application. */
  var RELAIS_CONTACT = '';

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
    /* Une marque de faute qui ne s'efface pas devient un mensonge : le champ rempli
       restait orange. Elle part dès que le champ redevient acceptable. */
    var laver = function (champ) {
      champ.style.borderColor = '';
      champ.removeAttribute('aria-invalid');
      var d = document.getElementById('dit-' + champ.id);
      if (d) d.remove();
    };
    var marquer = function (champ, phrase) {
      champ.style.borderColor = '#e8a33d';
      champ.setAttribute('aria-invalid', 'true');
      if (!document.getElementById('dit-' + champ.id)) {
        // Déplacer le curseur sans rien dire ne renseigne personne, et un lecteur
        // d'écran n'a alors aucun moyen de savoir POURQUOI il a été déplacé.
        var d = document.createElement('p');
        d.id = 'dit-' + champ.id;
        d.className = 'dit-faute';
        d.setAttribute('role', 'alert');
        d.textContent = phrase;
        champ.insertAdjacentElement('afterend', d);
        champ.setAttribute('aria-describedby', d.id);
      }
      champ.scrollIntoView({ block: 'center', behavior: 'smooth' });
      champ.focus();
    };
    ['nom', 'email', 'message', 'societe', 'tel'].forEach(function (id) {
      var champ = document.getElementById(id);
      if (champ) champ.addEventListener('input', function () { laver(champ); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var courriel = document.getElementById('email');
      var fautif = null, phrase = '';
      ['nom', 'email', 'message'].forEach(function (id) {
        var champ = document.getElementById(id);
        if (champ && !champ.value.trim() && !fautif) {
          fautif = champ;
          phrase = 'Ce champ est nécessaire pour vous répondre.';
        }
      });
      /* Une adresse mal tapée ne casse rien ici — mais la réponse n'arrive jamais,
         et personne ne sait pourquoi. Autant le dire pendant qu'on est sur la page. */
      if (!fautif && courriel && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(courriel.value.trim())) {
        fautif = courriel;
        phrase = 'Cette adresse ne permettra pas de vous répondre — vérifiez-la.';
      }
      if (fautif) { marquer(fautif, phrase); return; }

      var v = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
      var profil = (form.querySelector('input[name="profil"]:checked') || {}).value || 'une entreprise';
      var donnees = {
        profil: profil, nom: v('nom'), societe: v('societe'), email: v('email'),
        tel: v('tel'), message: v('message'), piege: v('site-web')
      };
      var corps = [
        'Je suis ' + profil + '.', '',
        'Nom : ' + donnees.nom,
        'Société : ' + (donnees.societe || '—'),
        'Email : ' + donnees.email,
        'Téléphone : ' + (donnees.tel || '—'), '',
        donnees.message
      ].join('\n');

      var bouton = form.querySelector('button[type=submit]');
      var dit = document.getElementById('dit-envoi');
      var annoncer = function (classe, texte) {
        if (!dit) return;
        dit.className = 'dit-envoi ' + classe;
        dit.textContent = texte;
        dit.hidden = false;
      };
      /* Le repli : on ouvre le logiciel de messagerie, et on le DIT. Ouvrir une fenêtre
         que le visiteur n'attend pas, sans un mot, se lit comme un bug. */
      var parMessagerie = function (pourquoi) {
        annoncer('rate', pourquoi + ' Votre logiciel de messagerie s’ouvre avec le message déjà '
          + 'rédigé. S’il ne s’ouvre pas, écrivez à contact@skanfact.tn.');
        window.location.href = 'mailto:contact@skanfact.tn'
          + '?subject=' + encodeURIComponent('SkanFact — demande de ' + donnees.nom)
          + '&body=' + encodeURIComponent(corps);
      };

      if (!RELAIS_CONTACT) { parMessagerie('Le formulaire n’est pas encore branché.'); return; }

      if (bouton) { bouton.disabled = true; bouton.textContent = 'Envoi…'; }
      var rendreLeBouton = function () {
        if (bouton) { bouton.disabled = false; bouton.textContent = 'Envoyer'; }
      };
      /* Un envoi sans limite de temps laisse quelqu'un devant « Envoi… » pour toujours. */
      var minuteur = setTimeout(function () { rendreLeBouton(); parMessagerie('L’envoi est trop lent.'); }, 12000);

      fetch(RELAIS_CONTACT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donnees)
      }).then(function (r) {
        return r.json().catch(function () { return { ok: r.ok }; })
          .then(function (j) { return { code: r.status, j: j }; });
      }).then(function (res) {
        clearTimeout(minuteur);
        rendreLeBouton();
        if (res.j && res.j.ok) {
          form.reset();
          annoncer('ok', 'Message envoyé. Nous répondons sous un jour ouvré, à ' + donnees.email + '.');
          return;
        }
        // 400 : c'est nous qui avons mal rempli. On le dit, on n'ouvre pas la messagerie.
        if (res.code === 400 && res.j && res.j.erreur) { annoncer('rate', res.j.erreur); return; }
        parMessagerie(res.j && res.j.configurer ? 'Le formulaire n’est pas encore branché.' : 'L’envoi a échoué.');
      }).catch(function () {
        clearTimeout(minuteur);
        rendreLeBouton();
        parMessagerie('L’envoi a échoué.');
      });
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

  /* ------------------------------------ le lien à remettre à un client (page Comptables)
     `navigator.clipboard` n'existe pas partout — un site servi en http, un vieux navigateur.
     On retombe alors sur la sélection du texte, qui marche depuis toujours. */
  var copier = document.getElementById('copier-lien');
  if (copier) {
    var ditCopie = document.getElementById('dit-copie');
    var motInitial = ditCopie ? ditCopie.textContent : '';
    copier.addEventListener('click', function () {
      var lien = copier.getAttribute('data-lien');
      var reussi = function () {
        copier.textContent = 'Lien copié';
        if (ditCopie) ditCopie.textContent = lien;
        setTimeout(function () {
          copier.textContent = 'Copier le lien';
          if (ditCopie) ditCopie.textContent = motInitial;
        }, 4000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(lien).then(reussi, function () {
          if (ditCopie) ditCopie.textContent = lien;
        });
      } else if (ditCopie) {
        // On l'affiche et on le sélectionne : il ne reste qu'à faire Cmd+C.
        ditCopie.textContent = lien;
        var r = document.createRange(); r.selectNodeContents(ditCopie);
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
      }
    });
  }


  /* ------------------------------------------------ la page Nouveautés
     La liste est déjà écrite dans la page : si cette requête échoue, on ne touche à rien et
     le visiteur voit quand même les six dernières versions. Une page qui dépend d'une API
     est une page qui peut être vide. */
  var listeVersions = document.getElementById('versions');
  if (listeVersions) {
    var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août',
                'septembre', 'octobre', 'novembre', 'décembre'];
    var enClair = function (iso) {
      var p = iso.slice(0, 10).split('-');
      return (+p[2]) + ' ' + MOIS[+p[1] - 1] + ' ' + p[0];
    };
    var ech = function (x) {
      return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };
    /* Le titre d'une version est la première phrase en gras de ses notes. Une URL crue y est
       illisible — c'est arrivé une fois, avec un message d'erreur cité entre guillemets. */
    var resumeDe = function (corps) {
      var b = String(corps || '').trim();
      var m = b.match(/^\*\*([\s\S]+?)\*\*/);
      var t = m ? m[1] : b.split('\n\n')[0];
      t = t.replace(/https?:\/\/\S+/g, '…').replace(/[*`_]/g, '').replace(/\s+/g, ' ').trim();
      return t.length > 190 ? t.slice(0, 187).replace(/\s\S*$/, '') + '…' : t;
    };

    fetch('https://api.github.com/repos/' + DEPOT + '/releases?per_page=12', {
      headers: { Accept: 'application/vnd.github+json' }
    })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (rels) {
        var vraies = (rels || []).filter(function (r) { return !r.prerelease && !r.draft; });
        if (!vraies.length) return;                 // rien de mieux à montrer que ce qui est déjà là
        listeVersions.innerHTML = vraies.map(function (r, i) {
          var v = (r.tag_name || '').replace(/^v/, '');
          return '<li class="version' + (i === 0 ? ' derniere' : '') + '">'
            + '<div class="v-num">' + ech(v) + (i === 0 ? '<span class="v-neuf">dernière</span>' : '') + '</div>'
            + '<div class="v-corps">'
            + '<p class="v-quoi">' + ech(resumeDe(r.body)) + '</p>'
            + '<p class="v-quand"><time datetime="' + ech((r.published_at || '').slice(0, 10)) + '">'
            + ech(enClair(r.published_at || '')) + '</time> · '
            + '<a href="' + ech(r.html_url) + '" rel="noopener">Notes complètes</a></p>'
            + '</div></li>';
        }).join('');
        var dit = document.getElementById('dit-versions');
        if (dit) {
          dit.innerHTML = (vraies.length === 1 ? 'La dernière version.'
              : 'Les ' + vraies.length + ' dernières versions.')
            + ' La liste complète est sur '
            + '<a href="' + RELEASES + '" rel="noopener">la page des versions</a>.';
        }
      })
      .catch(function () { /* la liste écrite dans la page reste affichée */ });
  }

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

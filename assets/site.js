/* =============================================================================
   SkanFact — le peu de JavaScript dont le site a besoin.
   Règle de conduite : la page doit être entièrement lisible et utilisable sans
   ce fichier. Il n'ajoute que du confort — et la dernière version publiée.
   ============================================================================= */
(function () {
  'use strict';

  /* La marque « ce fichier tourne ». Elle est posee TOUT DE SUITE, avant le reste, parce que
     c'est elle qui autorise la feuille de style a cacher les blocs qui apparaissent au
     defilement. Sans elle — JavaScript coupe, fichier non charge, erreur trois lignes plus
     bas — ces blocs restent simplement visibles, ce qui est le comportement voulu : on ne
     rend jamais du contenu invisible en pariant sur un script. */
  document.documentElement.classList.add('js');

  var DEPOT = 'saouthq/skanfact';
  var RELEASES = 'https://github.com/' + DEPOT + '/releases';

  /* L'adresse du relais qui remet les messages du formulaire — le MÊME worker Cloudflare que
     celui des mises à jour, avec une route `/contact` en plus. Tant que cette ligne est vide,
     ou si le relais ne répond pas, le formulaire repasse par le logiciel de messagerie du
     visiteur : on ne perd jamais un message parce qu'un service est en panne.
     Une seule ligne à remplir : voir worker/README.md dans le dépôt de l'application. */
  var RELAIS_CONTACT = '';

  /* La mesure d'audience. Une seule ligne à remplir : le nom du compte GoatCounter (gratuit,
     sans cookie, sans traceur, sans donnée personnelle). Tant qu'elle est vide, AUCUNE requête
     n'est faite vers un service tiers — un site ne doit pas se mettre à appeler quelqu'un
     d'autre parce qu'on a oublié de finir un réglage.
     La page Confidentialité annonce ce compteur EXACTEMENT quand il tourne : les deux
     paragraphes `data-mesure` s'échangent ci-dessous. Une phrase de confidentialité qu'un
     réglage peut rendre fausse est un défaut, pas une imprécision. */
  var MESURE = '';

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

  /* ------------------------------------------------- les menus déroulants
     Il y en a DEUX depuis la 10.0.0 — « Pour l'entreprise » et « Pour les cabinets » — et le
     code n'en connaissait qu'un, par son identifiant. Recopier le bloc aurait garanti la
     divergence : le second menu aurait eu, six mois plus tard, une touche Échap et pas
     l'autre. On les branche donc tous, quel que soit leur nombre.
     Sous 900 px ils sont dépliés dans le panneau du burger : la feuille de style s'en charge,
     et ces boutons n'existent plus.
     Ouvrir l'un FERME l'autre : deux panneaux ouverts se recouvrent, et le second se lit
     comme la suite du premier. */
  var sousMenus = [].slice.call(document.querySelectorAll('.sous'))
    .map(function (bloc) { return { bloc: bloc, bouton: bloc.querySelector('.lien-menu') }; })
    .filter(function (m) { return m.bouton; });

  var fermerSousMenus = function (sauf) {
    sousMenus.forEach(function (m) {
      if (m.bloc === sauf) return;
      m.bloc.classList.remove('ouvert');
      m.bouton.setAttribute('aria-expanded', 'false');
    });
  };

  sousMenus.forEach(function (m) {
    m.bouton.addEventListener('click', function (e) {
      e.stopPropagation();
      var ouvert = !m.bloc.classList.contains('ouvert');
      fermerSousMenus(ouvert ? m.bloc : null);
      m.bloc.classList.toggle('ouvert', ouvert);
      m.bouton.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    });
  });

  if (sousMenus.length) {
    // Un menu qui ne se referme pas ailleurs reste en travers du contenu.
    document.addEventListener('click', function (e) {
      var dedans = sousMenus.some(function (m) { return m.bloc.contains(e.target); });
      if (!dedans) fermerSousMenus(null);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var ouvert = sousMenus.filter(function (m) { return m.bloc.classList.contains('ouvert'); })[0];
      if (!ouvert) return;
      fermerSousMenus(null);
      ouvert.bouton.focus();
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
  /* ------------------------------------------------- les formulaires
     Il y en a DEUX — nous écrire, et demander une clé — et ils n'ont pas les mêmes champs. Un
     second gestionnaire recopié serait la garantie que l'un des deux perde un correctif : ils
     passent donc par le même code, qui ne connaît d'eux que ce que leur balisage déclare.
       `data-envoi` : le genre de message (« contact », « commande »), transmis au relais ;
       `data-sujet` : l'objet du message de secours ;
       `required`   : ce qui est exigé — l'attribut sert enfin à quelque chose, alors qu'un
                      formulaire soumis par bouton ne déclenche aucune validation du navigateur.
     Les intitulés partent avec le message : le relais n'a pas à connaître les champs de chaque
     formulaire, et un champ ajouté demain arrive tout seul dans l'email. */
  /* ------------------------------------------------- qui tient votre comptabilité
     Une QUESTION, pas une vente en plus. Celui qui a un cabinet lit « rien à ajouter » ; celui
     qui tient ses livres lui-même voit l'option. C'est aussi la seule façon de savoir combien
     d'acheteurs ont un cabinet — le chiffre qui dira si le canal cabinet existe vraiment.
     Sans JavaScript, les DEUX blocs restent visibles et le formulaire marche : l'option se coche
     à la main, et le nom du cabinet aussi. On ne cache jamais un champ qu'on ne peut pas rendre. */
  (function () {
    var tenue = document.querySelectorAll('input[name="tenue"]');
    var blocCabinet = document.getElementById('bloc-cabinet');
    var blocCompta = document.getElementById('bloc-compta');
    if (!tenue.length || !blocCabinet || !blocCompta) return;
    var montrer = function () {
      var choisi = document.querySelector('input[name="tenue"]:checked');
      var soi = !!(choisi && choisi.getAttribute('data-tenue') === 'soi');
      blocCabinet.hidden = soi;
      blocCompta.hidden = !soi;
      /* Décocher en repartant vers « un cabinet » : sinon l'option resterait dans le message
         envoyé alors que l'écran ne la montre plus — on facturerait ce que personne ne voit. */
      if (!soi) { var c = document.getElementById('opt-compta'); if (c) c.checked = false; }
    };
    Array.prototype.forEach.call(tenue, function (r) { r.addEventListener('change', montrer); });
    montrer();
  }());

  Array.prototype.forEach.call(document.querySelectorAll('form[data-envoi]'), function (form) {
    var genre = form.getAttribute('data-envoi');
    var sujet = form.getAttribute('data-sujet') || 'SkanFact';

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

    var champs = Array.prototype.slice.call(form.querySelectorAll('input[name], textarea[name]'))
      .filter(function (c) { return c.type !== 'radio' && c.type !== 'hidden' && c.name !== 'piege'; });
    champs.forEach(function (c) { c.addEventListener('input', function () { laver(c); }); });

    /* L'intitulé d'un champ, pour l'email : son `<label>`, débarrassé de l'étoile. */
    var intitule = function (c) {
      var l = form.querySelector('label[for="' + c.id + '"]') || c.closest('label');
      var t = l ? l.textContent : c.name;
      return t.replace(/\s*\*\s*$/, '').trim();
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fautif = null, phrase = '';
      champs.forEach(function (c) {
        if (!fautif && c.required && !c.value.trim()) {
          fautif = c;
          phrase = 'Ce champ est nécessaire pour vous répondre.';
        }
      });
      /* Une adresse mal tapée ne casse rien ici — mais la réponse n'arrive jamais,
         et personne ne sait pourquoi. Autant le dire pendant qu'on est sur la page. */
      var courriel = form.querySelector('input[type=email]');
      if (!fautif && courriel && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(courriel.value.trim())) {
        fautif = courriel;
        phrase = 'Cette adresse ne permettra pas de vous répondre — vérifiez-la.';
      }
      if (fautif) { marquer(fautif, phrase); return; }

      /* Le corps du message est assemblé ICI, avec les intitulés que la page affiche : le relais
         n'a donc pas à connaître les champs de chaque formulaire, et un champ ajouté demain
         arrive tout seul dans l'email sans qu'on redéploie quoi que ce soit. */
      var lignes = [];
      Array.prototype.forEach.call(form.querySelectorAll('fieldset'), function (fs) {
        var coche = fs.querySelector('input[type=radio]:checked');
        var lg = fs.querySelector('legend');
        // Un bouton radio porte son intitulé sur la LÉGENDE du groupe, pas sur le champ.
        if (coche && lg) lignes.push(lg.textContent.replace(/\s*\*\s*$/, '').trim() + ' : ' + coche.value);
      });
      var valeurs = {};
      champs.forEach(function (c) {
        valeurs[c.name] = c.value.trim();
        lignes.push(intitule(c) + ' : ' + (c.value.trim() || '—'));
      });
      var piege = form.querySelector('[name=piege]');
      var corps = lignes.join('\n');
      var nom = valeurs.nom || valeurs.raison || '';
      var donnees = {
        genre: genre, nom: nom, email: valeurs.email || '',
        corps: corps, piege: piege ? piege.value.trim() : ''
      };

      var bouton = form.querySelector('button[type=submit]');
      var libelle = bouton ? bouton.textContent : '';
      var dit = form.querySelector('.dit-envoi');
      var annoncer = function (classe, texte) {
        if (!dit) return;
        dit.className = 'dit-envoi ' + classe;
        dit.textContent = texte;
        dit.hidden = false;
      };
      /* Le repli : on ouvre le logiciel de messagerie, et on le DIT. Ouvrir une fenêtre
         que le visiteur n'attend pas, sans un mot, se lit comme un bug. */
      var parMessagerie = function (pourquoi) {
        annoncer('rate', pourquoi + ' Votre logiciel de messagerie s\u2019ouvre avec le message déjà '
          + 'rédigé. S\u2019il ne s\u2019ouvre pas, écrivez à contact@skanfact.tn.');
        window.location.href = 'mailto:contact@skanfact.tn'
          + '?subject=' + encodeURIComponent(sujet + (nom ? ' — ' + nom : ''))
          + '&body=' + encodeURIComponent(corps);
      };

      if (!RELAIS_CONTACT) { parMessagerie('Le formulaire n\u2019est pas encore branché.'); return; }

      if (bouton) { bouton.disabled = true; bouton.textContent = 'Envoi…'; }
      var rendreLeBouton = function () {
        if (bouton) { bouton.disabled = false; bouton.textContent = libelle; }
      };
      /* Un envoi sans limite de temps laisse quelqu'un devant « Envoi… » pour toujours. */
      var minuteur = setTimeout(function () { rendreLeBouton(); parMessagerie('L\u2019envoi est trop lent.'); }, 12000);

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
          annoncer('ok', genre === 'commande'
            ? 'Demande envoyée. Votre facture part sous un jour ouvré, à ' + donnees.email + '.'
            : 'Message envoyé. Nous répondons sous un jour ouvré, à ' + donnees.email + '.');
          return;
        }
        // 400 : c'est nous qui avons mal rempli. On le dit, on n'ouvre pas la messagerie.
        if (res.code === 400 && res.j && res.j.erreur) { annoncer('rate', res.j.erreur); return; }
        parMessagerie(res.j && res.j.configurer ? 'Le formulaire n\u2019est pas encore branché.' : 'L\u2019envoi a échoué.');
      }).catch(function () {
        clearTimeout(minuteur);
        rendreLeBouton();
        parMessagerie('L\u2019envoi a échoué.');
      });
    });
  });

  /* ------------------------------------------------- la séquence du logiciel
     Sans ce fichier, le balisage est une LISTE de dix figures légendées : une visite guidée
     parfaitement lisible, simplement plus longue. Le script la replie en lecteur. C'est la règle
     du site — la page doit se tenir sans JavaScript — et c'est aussi ce qui garantit que les
     images ont un texte de remplacement utile : elles sont écrites pour être lues seules.

     Pourquoi des images et pas une vidéo : à ce compte-là (dix états d'un écran), une vidéo pèse
     plus lourd, ne se lit pas au clavier, et n'a pas de légende. Ici chaque vue porte sa phrase. */
  var film = document.getElementById('film');
  if (film && film.children.length > 1) {
    var vues = Array.prototype.slice.call(film.children);
    var n = vues.length, i = 0, minuteur = null;
    var sobre = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    film.classList.add('film-lecteur');
    var barre = document.createElement('div');
    barre.className = 'film-barre';
    var points = vues.map(function (v, k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'film-point';
      /* Un point numéroté sans libellé ne dit rien à qui ne voit pas l'image : le titre de la
         vue est déjà écrit dans sa légende, on le reprend. */
      var titre = v.querySelector('figcaption b');
      b.setAttribute('aria-label', 'Écran ' + (k + 1) + ' sur ' + n + (titre ? ' : ' + titre.textContent : ''));
      b.addEventListener('click', function () { arreter(); montrer(k); });
      barre.appendChild(b);
      return b;
    });

    var bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = 'btn btn-petit btn-creux film-jouer';
    var precedent = document.createElement('button');
    precedent.type = 'button';
    precedent.className = 'film-fleche';
    precedent.setAttribute('aria-label', 'Écran précédent');
    precedent.innerHTML = '&#8249;';
    var suivant = document.createElement('button');
    suivant.type = 'button';
    suivant.className = 'film-fleche';
    suivant.setAttribute('aria-label', 'Écran suivant');
    suivant.innerHTML = '&#8250;';

    var cadre = document.createElement('div');
    cadre.className = 'film-cmd';
    cadre.appendChild(precedent);
    cadre.appendChild(barre);
    cadre.appendChild(suivant);
    cadre.appendChild(bouton);
    film.parentNode.insertBefore(cadre, film.nextSibling);

    function montrer(k) {
      i = (k + n) % n;
      vues.forEach(function (v, j) {
        v.classList.toggle('vue-ici', j === i);
        /* `hidden` et pas seulement une classe : une vue masquée ne doit pas être lue par un
           lecteur d'écran, ni attraper la tabulation. */
        v.hidden = j !== i;
      });
      points.forEach(function (b, j) { b.classList.toggle('ici', j === i); b.setAttribute('aria-current', j === i ? 'true' : 'false'); });
      /* Les images suivantes ne sont demandées qu'une fois qu'on approche : au chargement de la
         page, une seule des dix descend du serveur. */
      var proche = vues[(i + 1) % n].querySelector('img');
      if (proche && proche.loading === 'lazy') proche.loading = 'eager';
    }
    function jouer() {
      minuteur = setInterval(function () { montrer(i + 1); }, 2800);
      bouton.textContent = 'Pause';
      bouton.setAttribute('aria-pressed', 'true');
    }
    function arreter() {
      if (minuteur) { clearInterval(minuteur); minuteur = null; }
      bouton.textContent = 'Lire';
      bouton.setAttribute('aria-pressed', 'false');
    }
    bouton.addEventListener('click', function () { if (minuteur) arreter(); else jouer(); });
    precedent.addEventListener('click', function () { arreter(); montrer(i - 1); });
    suivant.addEventListener('click', function () { arreter(); montrer(i + 1); });
    /* Cliquer l'image avance : c'est le geste qu'on fait sans y penser. */
    film.addEventListener('click', function () { arreter(); montrer(i + 1); });

    montrer(0);
    arreter();
    /* On ne démarre pas une animation hors de l'écran — ni chez quelqu'un qui a demandé à son
       système de limiter les animations. Le lecteur reste alors entièrement utilisable à la main. */
    if (!sobre && window.IntersectionObserver) {
      new IntersectionObserver(function (entrees) {
        entrees.forEach(function (e) {
          if (e.isIntersecting && !minuteur && !film.dataset.touche) jouer();
          else if (!e.isIntersecting && minuteur) arreter();
        });
      }, { threshold: 0.4 }).observe(film);
      cadre.addEventListener('click', function () { film.dataset.touche = '1'; });
    }
  }

  /* ------------------------------------------------- la mesure d'audience
     GoatCounter ne dépose rien sur le poste du visiteur et ne reçoit ni adresse IP conservée,
     ni identifiant : il compte des pages vues. On respecte en plus « Do Not Track », que le
     service honore déjà — mais qui coûte deux lignes à honorer nous-mêmes, et qui prouve
     l'intention. */
  (function () {
    var compte = !!MESURE && navigator.doNotTrack !== '1' && window.doNotTrack !== '1';
    Array.prototype.forEach.call(document.querySelectorAll('[data-mesure]'), function (el) {
      el.hidden = (el.getAttribute('data-mesure') === 'oui') !== compte;
    });
    if (!compte) return;
    var g = document.createElement('script');
    g.async = true;
    g.setAttribute('data-goatcounter', 'https://' + MESURE + '.goatcounter.com/count');
    g.src = 'https://gc.zgo.at/count.js';
    document.head.appendChild(g);
  }());

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
  /* ------------------------------------------- ce qui apparait au defilement
     Quatorze pixels et une opacite, une seule fois par bloc. Trois garde-fous,
     dans cet ordre d'importance :
       1. sans IntersectionObserver (vieux navigateur), on RETIRE la classe au
          lieu de l'observer : le contenu doit se voir, toujours ;
       2. si la personne a demande moins d'animations, on ne pose rien — la
          feuille de style neutralise deja l'etat de depart, mais compter sur
          une seule des deux moities est exactement la faute que ce projet
          repete : la ceinture ET les bretelles ;
       3. on cesse d'observer un bloc des qu'il est vu : un observateur qui
          continue de surveiller quarante blocs pour rien fait ramer le
          defilement sur un telephone. */
  var blocs = [].slice.call(document.querySelectorAll('.reveal'));
  if (blocs.length) {
    var sobre = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!('IntersectionObserver' in window) || sobre) {
      blocs.forEach(function (b) { b.classList.add('vu'); });
    } else {
      var oeil = new IntersectionObserver(function (entrees) {
        entrees.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('vu');
          oeil.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      blocs.forEach(function (b) { oeil.observe(b); });
    }
  }
})();

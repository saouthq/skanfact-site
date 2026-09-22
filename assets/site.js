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

  /* Le formulaire de contact est servi par le worker des MISES À JOUR (skanfact-maj), pas
     par celui de la console : deux workers, deux adresses, et c'est la confusion la plus
     facile à faire ici. Vérifié de bout en bout côté application le 22/09/2026 — OPTIONS
     répond 204, un vrai POST a rendu {"ok":true} et le mail est arrivé.
     Si le relais répond 503 ou ne répond pas, le formulaire repasse par le logiciel de
     messagerie du visiteur : ce n'est plus le chemin normal, mais on ne perd jamais un
     message parce qu'un service est en panne.

     Le contrat : POST, Content-Type: application/json, { nom, email, message } — le relais
     accepte `corps` comme `message`, indifféremment. Il ne valide que ce dont il a besoin
     pour répondre : un nom, une adresse plausible, dix caractères de texte, et des longueurs
     maximales (5 000 pour le message).
     Le champ `piege`, caché en CSS : rempli, la réponse est « reçu » et rien ne part. C'est
     le SEUL champ inconnu que le relais regarde — il n'en refuse aucun autre. On n'envoie
     quand même que les champs du contrat, pour une autre raison : le corps du mail est
     composé ICI, avec les intitulés que la page affiche, donc un champ ajouté demain arrive
     tout seul dans le message sans qu'on redéploie le worker.
     Origines autorisées : skanfact.tn, www.skanfact.tn, saouthq.github.io — une autre reçoit
     un 404, donc un essai depuis un fichier local ne prouve rien. */
  var RELAIS_CONTACT = 'https://skanfact-maj.skanbenamor10.workers.dev/contact';

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
      .filter(function (c) {
        /* Un champ dans un bloc MASQUÉ n'est pas dans la commande : le choix du règlement
           n'existe pas tant que Konnect n'est pas branché, et le mail annonçait quand même
           « par virement » comme si on l'avait choisi. */
        return c.type !== 'radio' && c.type !== 'hidden' && c.name !== 'piege' && !c.closest('[hidden]');
      });
    champs.forEach(function (c) { c.addEventListener('input', function () { laver(c); }); });

    /* L'intitulé d'un champ, pour l'email : son `<label>`, débarrassé de l'étoile. */
    var intitule = function (c) {
      var l = form.querySelector('label[for="' + c.id + '"]') || c.closest('label');
      /* Un libellé de case à cocher porte son TITRE dans un <b> et sa description à côté :
         recopié en entier, le mail reçoit une phrase de deux lignes là où trois mots
         suffisent. Le titre d'abord ; à défaut, le libellé aplati — recopié tel quel, il
         s'étalait sur trois lignes indentées dans le mail. */
      var titre = l && l.querySelector('b');
      var t = ((titre ? titre.textContent : (l ? l.textContent : c.name)) || '').replace(/\s+/g, ' ');
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
        if (fs.hidden || fs.closest('[hidden]')) return;
        var coche = fs.querySelector('input[type=radio]:checked');
        var lg = fs.querySelector('legend');
        // Un bouton radio porte son intitulé sur la LÉGENDE du groupe, pas sur le champ.
        if (coche && lg) lignes.push(lg.textContent.replace(/\s*\*\s*$/, '').trim() + ' : ' + coche.value);
      });
      var valeurs = {};
      champs.forEach(function (c) {
        valeurs[c.name] = c.value.trim();
        lignes.push(intitule(c) + ' : ' + (c.value.trim().replace(/\s+/g, ' ') || '—'));
      });
      /* Le montant annoncé au visiteur voyage avec la commande. Sans lui, la facture se
         referait de tête à l'autre bout, et une remise de parrainage promise à l'écran
         pourrait ne pas s'y retrouver. */
      var compte = window.__decompte ? window.__decompte() : null;
      if (compte && compte.texte) {
        lignes.push('Montant annoncé : ' + compte.texte + (compte.parrain ? ' (remise parrainage appliquée)' : ''));
      }
      var piege = form.querySelector('[name=piege]');
      var corps = sujet + '\n\n' + lignes.join('\n');
      var nom = valeurs.nom || valeurs.raison || '';
      /* Les champs du contrat, et rien d'autre. Non pas parce qu'un champ en trop serait
         refusé — le relais ne regarde que `piege` — mais parce que le corps du mail est
         composé ICI, avec les intitulés que la page affiche : le genre du formulaire
         (message ou commande) est donc sa première ligne, et un champ ajouté demain arrive
         tout seul dans le message sans qu'on redéploie le worker. */
      var donnees = {
        nom: nom, email: valeurs.email || '', message: corps,
        piege: piege ? piege.value.trim() : ''
      };

      /* Le relais refuse au-delà de 5 000 caractères et en deçà de 10. On le dit ICI, sur le
         champ, plutôt que de laisser partir une requête dont on connaît déjà la réponse. */
      if (corps.length > 5000) {
        marquer(form.querySelector('textarea') || champs[champs.length - 1],
          'Ce message dépasse 5 000 caractères. Raccourcissez-le, ou écrivez-nous directement.');
        return;
      }

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
          /* La carte vient APRÈS la commande, jamais avant : si le paiement se lance et que
             la commande ne part pas, quelqu'un paie sans que personne ne sache pourquoi.
             Dans cet ordre, le pire cas est une commande sans paiement — c'est-à-dire le
             chemin du virement, qui marche. On ne vide donc pas le formulaire tout de suite :
             le paiement peut encore échouer, et on ne lui reprend pas ce qu'il a tapé. */
          var carte = form.querySelector('[data-regl=carte]');
          if ((PAIEMENT || APERCU_PAIEMENT) && carte && carte.checked) { payerEnLigne(valeurs, annoncer, bouton, libelle); return; }
          if (genre === 'commande') { confirmerCommande(form, valeurs); return; }
          form.reset();
          annoncer('ok', 'Message envoyé. Nous répondons sous un jour ouvré, à ' + donnees.email + '.');
          return;
        }
        // 400 : c'est nous qui avons mal rempli. On le dit, on n'ouvre pas la messagerie.
        if (res.code === 400 && res.j && res.j.erreur) { annoncer('rate', res.j.erreur); return; }
        // 503 : le service n'est pas configuré. On ne perd pas le message du visiteur.
        parMessagerie(res.code === 503 ? 'Le formulaire n\u2019est pas encore branché.'
          : 'L\u2019envoi a échoué.');
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

  /* ------------------------------------------------- le paiement en ligne (Konnect)
     Tant que cette ligne est vide, RIEN ne change : le choix du règlement reste masqué, la
     page d'achat annonce le virement, et personne ne se voit promettre une carte qui n'existe
     pas. Le compte marchand n'est pas encore validé au 22/09/2026.

     Le site ne parle JAMAIS à Konnect directement : la clé d'API ne peut pas vivre dans une
     page, et le MONTANT ne peut pas venir du navigateur — n'importe qui le modifierait. Le
     site envoie qui achète et quelle offre ; le worker tient le barème, appelle Konnect et
     renvoie l'adresse de paiement.
       POST <PAIEMENT>, Content-Type: application/json
       { offre, raison, matricule, adresse, nom, email, tel, cabinet }
       -> 200 { payUrl, ref }   ·   400 avec la raison   ·   503 pas encore configuré */
  var PAIEMENT = ''; /* À REMPLIR quand Konnect est validé : https://api.skanfact.tn/v1/commande/payer */

  /* L'aperçu : `?apercu-paiement=1` allume tous les écrans du paiement pour CE chargement de
     page, sans rien changer pour les visiteurs. Il fallait pouvoir relire le parcours entier
     avant de brancher Konnect — et l'allumer pour de bon en attendant aurait proposé une carte
     qui ne peut pas aboutir, c'est-à-dire la pire façon de préparer une vente.
     Il ne fabrique aucun faux paiement : sans adresse, l'appel échoue et le repli s'affiche,
     ce qui est précisément l'écran qu'on veut pouvoir relire aussi. */
  var APERCU_PAIEMENT = /(^|[?&])apercu-paiement=1(&|$)/.test(location.search);
  /* L'aperçu vise l'adresse FUTURE : le parcours s'exerce en entier, et comme la route
     n'existe pas encore, un clic réel y montre l'écran de repli — celui qu'il faut justement
     pouvoir relire. Le jour où `PAIEMENT` est rempli, c'est lui qui gagne, ici et nulle part
     ailleurs. */
  var CIBLE_PAIEMENT = PAIEMENT || (APERCU_PAIEMENT ? 'https://api.skanfact.tn/v1/commande/payer' : '');

  /* ------------------------------------------------- ce que vous allez régler
     Tout le parcours d'achat se faisait sans qu'un seul MONTANT s'affiche : on cochait une
     offre, on remplissait huit champs, et on découvrait le total sur la facture, le lendemain.
     Choisir sans voir ce qu'on paie n'est pas choisir.

     Le prix HT vit sur le bouton radio (`data-ht`), à côté du libellé que le visiteur lit :
     une seule vérité par offre, et le jour où un prix change, il change à un seul endroit.
     Le taux de TVA et le timbre sont ceux de la loi tunisienne au 22/09/2026 — À VÉRIFIER à
     chaque loi de finances. Le timbre est un montant FIXE en dinars, ajouté après la TVA :
     il n'y entre pas.

     Ce décompte est une ANNONCE, pas la facture : c'est la facture émise par SkanFact qui
     fait foi, et le texte le dit. */
  var TVA = 0.19;
  var TIMBRE = 1;
  var REMISE_PARRAIN = 0.20;

  var dinars = function (n) {
    var t = (Math.round(n * 1000) / 1000).toFixed(3).split('.');
    return t[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',' + t[1] + ' DT';
  };

  var decompte = document.getElementById('decompte');
  if (decompte) {
    var lignesDc = document.getElementById('dc-lignes');
    var totalDc = document.getElementById('dc-total');
    var motDc = document.getElementById('dc-mot');
    var champCabinet = document.getElementById('cabinet');

    var calculer = function () {
      var choisie = document.querySelector('input[name=offre]:checked');
      var ht = choisie ? Number(choisie.getAttribute('data-ht')) : 0;
      if (!ht) { decompte.hidden = true; return { total: 0 }; }
      decompte.hidden = false;
      /* La remise de parrainage ne s'applique QUE si un cabinet est nommé, et seulement la
         première année — c'est ce que la page Tarifs promet, et deux endroits qui promettent
         la même chose ne peuvent pas se contredire. */
      var parrain = !!(champCabinet && champCabinet.value.trim());
      var remise = parrain ? ht * REMISE_PARRAIN : 0;
      var net = ht - remise;
      var tva = net * TVA;
      var total = net + tva + TIMBRE;

      var l = '<li><span>Licence SkanFact</span><b>' + dinars(ht) + '</b></li>';
      if (parrain) {
        l += '<li class="dc-remise"><span>Remise parrainage — 20 % la première année</span><b>− '
          + dinars(remise) + '</b></li>';
      }
      l += '<li><span>TVA 19 %</span><b>' + dinars(tva) + '</b></li>'
        + '<li><span>Timbre fiscal</span><b>' + dinars(TIMBRE) + '</b></li>';
      lignesDc.innerHTML = l;
      totalDc.textContent = dinars(total);
      motDc.innerHTML = 'Pour une année, réglée en une fois. Aucun prélèvement ne se '
        + 'reconduit tout seul : à l’échéance, vous décidez.'
        + (parrain ? ' La remise s’applique parce que vous avez nommé un cabinet ; '
            + 'nous le vérifions avant d’établir la facture.' : '')
        + ' Ce décompte est une annonce : c’est la facture qui fait foi.';
      /* Le bouton NOMME ce qu'on va débiter quand c'est la carte : « Payer 465,100 DT » dit
         ce qui se passe au clic, là où « Demander ma clé » laisse croire qu'on demande encore.
         Par virement rien n'est prélevé, et le libellé le garde. */
      var btn = document.querySelector('#form-cle button[type=submit]');
      var parCarte = document.querySelector('[data-regl=carte]');
      if (btn && !btn.disabled) {
        btn.textContent = (parCarte && parCarte.checked && !parCarte.closest('[hidden]'))
          ? 'Payer ' + dinars(total) : 'Demander ma clé';
      }
      return { total: total, texte: dinars(total), parrain: parrain };
    };

    var formCle = document.getElementById('form-cle');
    if (formCle) {
      formCle.addEventListener('change', calculer);
      formCle.addEventListener('input', calculer);
    }
    calculer();
    window.__decompte = calculer;
  }

  /* Une commande qui se termine par une ligne grise au bas d'un formulaire de huit champs ne
     RESSEMBLE pas à une commande : on vient de donner son matricule et son adresse de
     facturation, et on se demande si quelque chose s'est passé. La confirmation REMPLACE donc
     le formulaire, redit ce qui a été demandé — l'offre, le matricule, l'adresse où part la
     facture — et nomme les trois étapes qui restent, avec leur délai.
     Elle nomme aussi le recours : sans lui, quelqu'un qui ne reçoit rien n'a qu'à attendre. */
  function confirmerCommande(form, valeurs) {
    var offre = (document.querySelector('input[name=offre]:checked') || {}).value || '';
    var lu = window.__decompte ? window.__decompte() : null;
    var montant = lu && lu.texte ? lu.texte : '';
    var esc = function (t) {
      return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    };
    var ligne = function (quoi, valeur) {
      return valeur ? '<li><span>' + esc(quoi) + '</span><b>' + esc(valeur) + '</b></li>' : '';
    };
    var bloc = document.createElement('div');
    bloc.className = 'confirme';
    bloc.setAttribute('role', 'status');
    bloc.innerHTML =
      '<h3>Demande enregistrée.</h3>'
      + '<p>Rien ne vous est prélevé aujourd’hui. Vous pouvez encore changer d’offre ou '
      + 'renoncer à réception de la facture.</p>'
      + '<ul class="recap">'
      + ligne('Offre', offre)
      + ligne('Société', valeurs.raison)
      + ligne('Matricule fiscal', valeurs.matricule)
      + ligne('Facture envoyée à', valeurs.email)
      + ligne('À régler', montant)
      + '</ul>'
      + '<ol class="suite">'
      + '<li><b>Sous un jour ouvré</b> — nous vous envoyons la facture par email, '
      + 'avec la TVA, le timbre fiscal et les coordonnées de paiement.</li>'
      + '<li><b>Vous réglez</b> — par virement, chèque ou espèces.</li>'
      + '<li><b>Vous recevez votre clé</b> — une ligne à coller dans '
      + '<em>Paramètres › L’application › Licence</em>.</li>'
      + '</ol>'
      + '<p class="aide-form">Rien reçu sous deux jours ouvrés ? Regardez vos '
      + 'indésirables, puis écrivez-nous à '
      + '<a href="mailto:contact@skanfact.tn">contact@skanfact.tn</a> en rappelant votre '
      + 'matricule : nous retrouvons la demande.</p>';
    form.parentNode.replaceChild(bloc, form);
    bloc.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  /* On n'envoie que QUI achète et QUELLE offre. Le montant, la TVA et le timbre sont
     calculés par le worker, qui tient le barème : un prix qui vient du navigateur est un
     prix que le navigateur peut changer. */
  function payerEnLigne(valeurs, annoncer, bouton, libelle) {
    var offre = (document.querySelector('input[name=offre]:checked') || {}).value || '';
    annoncer('ok', 'Commande enregistrée. Ouverture de la page de paiement…');
    if (bouton) { bouton.disabled = true; bouton.textContent = 'Paiement…'; }
    var fini = false;
    /* Le repli DIT ce qui est déjà acquis : la commande est partie, donc la facture suit de
       toute façon. Sans cette phrase, un échec de paiement se lit comme « rien n'a marché »
       et la personne recommence tout. */
    var replier = function (pourquoi) {
      if (fini) return;
      fini = true;
      if (bouton) { bouton.disabled = false; bouton.textContent = libelle; }
      annoncer('rate', pourquoi + ' Votre commande, elle, est bien enregistrée : la facture '
        + 'part sous un jour ouvré et vous réglerez par virement.');
    };
    var minuteur = setTimeout(function () { replier('La page de paiement ne répond pas.'); }, 15000);

    fetch(CIBLE_PAIEMENT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offre: offre, raison: valeurs.raison || '', matricule: valeurs.matricule || '',
        adresse: valeurs.adresse || '', nom: valeurs.nom || '', email: valeurs.email || '',
        tel: valeurs.tel || '', cabinet: valeurs.cabinet || ''
      })
    }).then(function (r) {
      return r.json().catch(function () { return {}; })
        .then(function (j) { return { code: r.status, j: j }; });
    }).then(function (res) {
      if (fini) return;
      clearTimeout(minuteur);
      if (res.j && res.j.payUrl) { fini = true; window.location.href = res.j.payUrl; return; }
      replier(res.code === 400 && res.j && res.j.erreur ? res.j.erreur
        : 'Le paiement par carte n’a pas pu s’ouvrir.');
    }).catch(function () { clearTimeout(minuteur); replier('Le paiement par carte n’a pas pu s’ouvrir.'); });
  }

  if (PAIEMENT || APERCU_PAIEMENT) {
    var blocRegl = document.getElementById('bloc-reglement');
    if (blocRegl) blocRegl.hidden = false;
    /* La phrase de l'étape 3 suit le réglage : une phrase qu'un réglage peut rendre fausse
       est un défaut, pas une imprécision. */
    Array.prototype.forEach.call(document.querySelectorAll('[data-paiement]'), function (el) {
      el.hidden = el.getAttribute('data-paiement') !== 'oui';
    });
  }

  /* ------------------------------------------------- l'offre choisie sur la page Tarifs
     Les trois cartes de Tarifs menaient toutes au téléchargement : depuis la grille des prix,
     personne ne pouvait acheter. Elles portent maintenant « Acheter cette offre », et l'offre
     arrive ici par `?offre=` — sinon on la choisirait deux fois, et la seconde fois on se
     demanderait si la première a été perdue.
     Le lien fonctionne sans JavaScript : il mène à la page d'achat, simplement sans la case
     déjà cochée. */
  var offreVoulue = (new URLSearchParams(location.search).get('offre') || '').toLowerCase();
  if (offreVoulue) {
    var radios = [].slice.call(document.querySelectorAll('input[name=offre]'));
    var sansAccent = function (t) { return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
    var vise = radios.filter(function (r) { return sansAccent(r.value).indexOf(offreVoulue) === 0; })[0];
    if (vise) { vise.checked = true; }
  }

  /* ------------------------------------------------- la référence du paiement
     Konnect ramène sa référence dans l'adresse de retour. C'est la SEULE chose que la page de
     succès sait du paiement — elle n'interroge rien, elle ne décide rien — et c'est ce qu'on
     demande à quelqu'un qui écrit parce que sa clé n'est pas arrivée. Absente, la ligne ne
     s'affiche pas : mieux vaut pas de référence qu'une case vide. */
  var boiteRef = document.getElementById('ref-paiement');
  if (boiteRef) {
    var q = new URLSearchParams(location.search);
    var ref = q.get('payment_ref') || q.get('paymentRef') || q.get('ref') || '';
    if (/^[A-Za-z0-9_-]{6,64}$/.test(ref)) {
      boiteRef.innerHTML = 'Référence du paiement&nbsp;: <b class="mono"></b>';
      boiteRef.querySelector('b').textContent = ref;
      boiteRef.hidden = false;
    }
  }

  /* ------------------------------------------------- vérifier une licence
     Elle se fait DANS la page. Le bouton renvoyait sur api.skanfact.tn : ça marchait, mais le
     visiteur quittait le site pour une page nue, sans en-tête, sans menu et sans retour — au
     moment précis où il cherche à se rassurer sur une clé qu'on vient de lui vendre.

     Ce que la route NE DIT JAMAIS, et c'est voulu : à qui la licence appartient. Pas de nom,
     pas de matricule, pas d'adresse. Ils n'arrivent pas, et on n'essaie pas de les afficher.

     La phrase affichée est celle que le serveur RENVOIE (`phrase`), jamais une phrase réécrite
     ici : c'est elle qui sera corrigée le jour où la formulation doit changer, et deux
     formulations pour le même verdict finiraient par se contredire.

     L'empreinte part telle que le visiteur la colle — avec ou sans tirets, dans la casse qu'il
     veut. La nettoyer ici, c'est décider à la place du serveur de ce qui est lisible, et se
     tromper le jour où le format évolue. */
  var formVerif = document.getElementById('form-verif');
  if (formVerif) {
    var VERIF = 'https://api.skanfact.tn/v1/verif/licence';
    var SECOURS = document.getElementById('verif-secours');
    var champVerif = document.getElementById('empreinte');
    var boite = document.getElementById('verdict');
    var btnVerif = formVerif.querySelector('button[type=submit]');
    var libelleVerif = btnVerif ? btnVerif.textContent : 'Vérifier';

    var poser = function (classe, titre, phrase, detail) {
      boite.className = 'verdict ' + classe;
      boite.innerHTML = '';
      var b = document.createElement('b'); b.textContent = titre; boite.appendChild(b);
      var p = document.createElement('p'); p.textContent = phrase; boite.appendChild(p);
      if (detail) {
        var d = document.createElement('p'); d.className = 'detail'; d.textContent = detail;
        boite.appendChild(d);
      }
      boite.hidden = false;
    };

    /* Un état inconnu du site — parce que le serveur en aura ajouté un — ne doit pas produire
       une boîte vide : on retombe sur le titre neutre, et la phrase du serveur suffit. */
    var TITRES = {
      valable: 'Licence valable', expiree: 'Licence expirée', revoquee: 'Licence révoquée',
      remplacee: 'Licence remplacée', inconnue: 'Licence inconnue', illisible: 'Empreinte illisible'
    };

    formVerif.addEventListener('submit', function (e) {
      e.preventDefault();
      var saisie = champVerif.value.trim();
      if (!saisie) {
        poser('non', 'Empreinte manquante', 'Collez l’empreinte que SkanFact affiche sous Paramètres › L’application › Licence.');
        champVerif.focus();
        return;
      }
      if (SECOURS) SECOURS.hidden = true;
      if (btnVerif) { btnVerif.disabled = true; btnVerif.textContent = 'Vérification…'; }
      var rendre = function () {
        if (btnVerif) { btnVerif.disabled = false; btnVerif.textContent = libelleVerif; }
      };
      /* Sans limite de temps, on reste devant « Vérification… » pour toujours. */
      var fini = false;
      var replier = function () {
        if (fini) return;
        fini = true;
        rendre();
        boite.hidden = true;
        if (SECOURS) SECOURS.hidden = false;
      };
      var minuteur = setTimeout(replier, 12000);

      fetch(VERIF, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empreinte: saisie })
      }).then(function (r) { return r.json(); }).then(function (j) {
        if (fini) return;
        fini = true;
        clearTimeout(minuteur);
        rendre();
        if (!j || !j.etat) { replier(); return; }
        /* La date arrive du serveur ; on ne la réécrit pas, on la présente seulement dans
           l'ordre où elle se lit ici quand elle est ISO. Toute autre forme passe telle quelle :
           deviner un format qu'on ne connaît pas, c'est afficher une date fausse. */
        var jour = function (v) {
          var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v));
          return m ? m[3] + '/' + m[2] + '/' + m[1] : String(v);
        };
        var lignes = [];
        if (j.offre) lignes.push('Offre : ' + j.offre);
        if (j.fin) lignes.push('Fin : ' + jour(j.fin));
        poser(j.ok ? 'oui' : 'non', TITRES[j.etat] || 'Réponse du serveur',
          j.phrase || '', lignes.join(' · '));
      }).catch(function () { clearTimeout(minuteur); replier(); });
    });
  }
})();

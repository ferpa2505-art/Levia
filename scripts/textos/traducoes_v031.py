"""
Traduções (15 idiomas) dos textos novos da v0.3.x que ainda caíam para o inglês.
Gera scripts/textos/traducoes_v031.json no formato do adicionar_textos.py.
Uso: python scripts/textos/traducoes_v031.py && python scripts/adicionar_textos.py scripts/textos/traducoes_v031.json
"""
import io, json, os

K = """med.adicionar med.vazio med.nome med.nomePh med.dica3letras med.dose med.continuo med.continuoDesc med.frequencia
med.cadaH med.1xDia med.1xSemana med.primeiraDose med.previaHorarios med.previaSemanal med.tratamento med.esporadico
med.esporadicoDesc med.dias med.vezesDia med.xVezes med.inicioData med.inicioHora med.previaTratamento med.lembretes
med.lembretesDesc med.calendario med.calendarioDesc med.obs med.obsPh med.erroNome med.salva med.okLembretes
med.semPermissao med.okCalendario med.calendarioNegado med.excluir med.excluirTitulo med.excluirMsg med.notifTitulo
med.proxima med.ate med.hojeAs med.amanhaAs med.tratamentoConcluido ali.proteina ali.carbo ali.registrar ali.vazio
ref.titulo ref.qual ref.tipoLivrePh ref.horario ref.fotoTitulo ref.fotoDesc ref.camera ref.galeria ref.fotoSalvaTitulo
ref.fotoSalvaMsg ref.iaEmBreve ref.semPermissaoFoto ref.oQueComeu ref.buscarPh ref.incluir ref.manual ref.manualNome
ref.protG ref.carbG ref.macros ref.total ref.precisaItem ref.lembrete ref.lembreteEm ref.lembreteOk ref.lembreteFalhou
ref.notifTitulo ref.notifCorpo ref.obsPh ref.salva ref.excluir ref.excluirTitulo form.unidade form.erroNumero
form.erroDias form.erroGramas form.erroPeso dia.medicoesHoje dia.registrar dia.horario dia.obsPh dia.erroValor
dia.semMedicoes dia.notas dia.notaPh dia.semNotas atu.versao atu.ultima atu.original atu.procurar atu.procurando
atu.baixando atu.emDia atu.pronta atu.reiniciar atu.erro""".split()

T = {}

T['it'] = ["Aggiungi", "Nessun farmaco. Tocca Aggiungi per inserire il primo.", "Farmaco", "Scrivi il nome (es.: Azitromicina)", "Scrivi 3 lettere per vedere i suggerimenti.", "Dose", "Uso continuativo", "Farmaco senza data di fine.", "Posologia",
"ogni {h} h", "1 volta al giorno", "1 volta a settimana", "Orario della 1ª dose", "Promemoria ogni giorno alle {h}", "Promemoria ogni settimana, in questo giorno, alle {h}", "Terapia", "Al bisogno",
"Farmaco preso solo quando serve: viene registrato, senza promemoria.", "Durata (giorni)", "Volte al giorno", "{n}x", "Inizio della terapia", "Orario della 1ª dose", "{n} dosi · ultima il {fim}", "Promemoria sul telefono",
"Una notifica all'ora di ogni dose, anche ad app chiusa.", "Aggiungi al mio calendario", "Crea gli orari nel calendario del telefono (compare in Google Calendar).", "Note", "Es.: prendere dopo pranzo", "Inserisci il nome del farmaco.", "Farmaco salvato ✅", "I promemoria sono programmati e suonano anche ad app chiusa.",
"Promemoria non programmati. Consenti le notifiche di Leviã in Impostazioni Android > App > Leviã > Notifiche.", "{n} orario/i aggiunto/i al calendario.", "Nessuna autorizzazione al calendario. Puoi concederla in Impostazioni Android > App > Leviã > Autorizzazioni.", "Elimina farmaco", "Eliminare il farmaco?", "{nome} e tutti i suoi promemoria verranno rimossi.", "💊 Ora del farmaco",
"Prossima: {quando}", "fino al {fim}", "oggi alle {h}", "domani alle {h}", "Terapia conclusa", "g proteine", "g carboidrati", "Registra un pasto", "Nessun pasto registrato in questo giorno. Scegline uno per iniziare:",
"Pasto", "Quale pasto?", "Nome del pasto (es.: pre-allenamento)", "Orario", "Foto del piatto", "Fotografa il piatto per salvarlo con il pasto.", "Fotocamera", "Galleria", "📸 Foto salvata nel pasto!",
"Stiamo addestrando l'IA di Leviã a riconoscere i piatti. Presto identificherà cosa c'è nel piatto e calcolerà calorie, proteine e carboidrati in automatico.", "✨ In arrivo: l'IA di Leviã riconoscerà questo piatto e compilerà gli alimenti per te.", "Nessuna autorizzazione. Consenti fotocamera/foto di Leviã in Impostazioni Android > App > Leviã > Autorizzazioni.", "Cosa hai mangiato?", "Cerca alimento o ricetta (es.: riso)", "Aggiungi", "Non lo trovi? Inserisci i valori", "Nome dell'alimento",
"prot. (g)", "carb. (g)", "{kcal} kcal · {prot} g prot · {carb} g carb", "Totale: {kcal} kcal · {prot} g prot · {carb} g carb", "Aggiungi almeno un alimento o una foto.", "Promemoria del prossimo pasto", "Avvisami {h} h dopo questo pasto", "Ti ricorderemo il prossimo pasto tra {h} h.", "Promemoria non programmato (ora già passata o notifiche bloccate).",
"🍽️ Ora del prossimo pasto", "Sono passate {h} h dall'ultimo pasto.", "Es.: mangiato poco, nausea dopo", "Pasto salvato ✅", "Elimina pasto", "Eliminare questo pasto?", "Unità", "Valore non valido. Usa solo numeri (es.: 12,5).",
"Inserisci da 1 a 365 giorni.", "Inserisci una quantità tra 1 e 5000 g.", "Inserisci un peso tra 20 e 400 kg.", "Misurazioni di oggi", "Registra", "Orario della misurazione", "Nota (es.: a digiuno, dopo pranzo)", "Valore inatteso. Usa tra {min} e {max} {u}.",
"Nessuna misurazione oggi. Tocca Registra.", "Note di oggi", "Come ti senti oggi?", "Nessuna nota oggi.", "Versione dell'app", "Ultimo aggiornamento", "versione installata", "Cerca aggiornamenti", "Ricerca in corso...",
"Download dell'aggiornamento...", "Leviã è aggiornato ✅", "Aggiornamento scaricato! Tocca qui sotto per applicarlo.", "Applica e riavvia l'app", "Impossibile verificare ora. Controlla la connessione e riprova."]

T['fr'] = ["Ajouter", "Aucun médicament. Touchez Ajouter pour saisir le premier.", "Médicament", "Saisissez le nom (ex. : Azithromycine)", "Saisissez 3 lettres pour voir des suggestions.", "Dose", "Traitement au long cours", "Médicament sans date de fin.", "Posologie",
"toutes les {h} h", "1 fois par jour", "1 fois par semaine", "Heure de la 1re prise", "Rappels tous les jours à {h}", "Rappel chaque semaine, ce jour-là, à {h}", "Traitement", "Si besoin",
"Pris seulement si nécessaire : enregistré, sans rappel.", "Durée (jours)", "Fois par jour", "{n}x", "Début du traitement", "Heure de la 1re prise", "{n} prises · dernière le {fim}", "Rappels sur le téléphone",
"Une notification à chaque prise, même app fermée.", "Ajouter à mon agenda", "Crée les horaires dans l'agenda du téléphone (visible dans Google Agenda).", "Notes", "Ex. : prendre après le déjeuner", "Indiquez le nom du médicament.", "Médicament enregistré ✅", "Les rappels sont programmés et sonneront même app fermée.",
"Rappels non programmés. Autorisez les notifications de Leviã dans Paramètres Android > Applications > Leviã > Notifications.", "{n} horaire(s) ajouté(s) à votre agenda.", "Pas d'accès à l'agenda. Autorisez-le dans Paramètres Android > Applications > Leviã > Autorisations.", "Supprimer le médicament", "Supprimer le médicament ?", "{nome} et tous ses rappels seront supprimés.", "💊 Heure du médicament",
"Prochaine : {quando}", "jusqu'au {fim}", "aujourd'hui à {h}", "demain à {h}", "Traitement terminé", "g protéines", "g glucides", "Enregistrer un repas", "Aucun repas ce jour-là. Choisissez-en un pour commencer :",
"Repas", "Quel repas ?", "Nom du repas (ex. : avant le sport)", "Heure", "Photo de l'assiette", "Photographiez votre assiette pour la garder avec le repas.", "Appareil photo", "Galerie", "📸 Photo ajoutée au repas !",
"Nous entraînons l'IA de Leviã à reconnaître les plats. Bientôt, elle identifiera le contenu de l'assiette et calculera calories, protéines et glucides automatiquement.", "✨ Bientôt : l'IA de Leviã reconnaîtra cette assiette et remplira les aliments pour vous.", "Pas d'autorisation. Autorisez l'appareil photo/les photos de Leviã dans Paramètres Android > Applications > Leviã > Autorisations.", "Qu'avez-vous mangé ?", "Chercher un aliment ou une recette (ex. : riz)", "Ajouter", "Introuvable ? Saisissez les valeurs", "Nom de l'aliment",
"prot. (g)", "gluc. (g)", "{kcal} kcal · {prot} g prot · {carb} g gluc", "Total : {kcal} kcal · {prot} g prot · {carb} g gluc", "Ajoutez au moins un aliment ou une photo.", "Rappel du prochain repas", "Me rappeler {h} h après ce repas", "Nous vous rappellerons le prochain repas dans {h} h.", "Rappel non programmé (heure dépassée ou notifications bloquées).",
"🍽️ Heure du prochain repas", "{h} h se sont écoulées depuis votre dernier repas.", "Ex. : peu mangé, nausée ensuite", "Repas enregistré ✅", "Supprimer le repas", "Supprimer ce repas ?", "Unité", "Valeur invalide. Chiffres uniquement (ex. : 12,5).",
"Indiquez de 1 à 365 jours.", "Indiquez une quantité entre 1 et 5000 g.", "Indiquez un poids entre 20 et 400 kg.", "Mesures du jour", "Enregistrer", "Heure de la mesure", "Note (ex. : à jeun, après le déjeuner)", "Valeur inattendue. Entre {min} et {max} {u}.",
"Aucune mesure aujourd'hui. Touchez Enregistrer.", "Notes du jour", "Comment vous sentez-vous aujourd'hui ?", "Aucune note aujourd'hui.", "Version de l'app", "Dernière mise à jour", "version installée", "Rechercher une mise à jour", "Recherche...",
"Téléchargement...", "Leviã est à jour ✅", "Mise à jour téléchargée ! Touchez ci-dessous pour l'appliquer.", "Appliquer et redémarrer l'app", "Vérification impossible pour l'instant. Vérifiez votre connexion et réessayez."]

T['de'] = ["Hinzufügen", "Noch keine Medikamente. Tippe auf Hinzufügen.", "Medikament", "Namen eingeben (z. B. Azithromycin)", "Gib 3 Buchstaben ein, um Vorschläge zu sehen.", "Dosis", "Dauereinnahme", "Medikament ohne Enddatum.", "Einnahmeplan",
"alle {h} Std.", "1x täglich", "1x pro Woche", "Uhrzeit der 1. Dosis", "Erinnerung täglich um {h}", "Erinnerung wöchentlich, an diesem Wochentag, um {h}", "Behandlung", "Bei Bedarf",
"Nur bei Bedarf: wird gespeichert, ohne Erinnerungen.", "Dauer (Tage)", "Mal pro Tag", "{n}x", "Beginn der Behandlung", "Uhrzeit der 1. Dosis", "{n} Dosen · letzte am {fim}", "Erinnerungen auf dem Handy",
"Eine Benachrichtigung zu jeder Dosis, auch bei geschlossener App.", "Zu meinem Kalender hinzufügen", "Trägt die Zeiten in den Handy-Kalender ein (erscheint im Google Kalender).", "Notizen", "z. B. nach dem Mittagessen einnehmen", "Gib den Namen des Medikaments ein.", "Medikament gespeichert ✅", "Erinnerungen sind geplant und kommen auch bei geschlossener App.",
"Keine Erinnerungen geplant. Erlaube Benachrichtigungen für Leviã unter Android-Einstellungen > Apps > Leviã > Benachrichtigungen.", "{n} Termin(e) im Kalender eingetragen.", "Kein Kalenderzugriff. Erlaube ihn unter Android-Einstellungen > Apps > Leviã > Berechtigungen.", "Medikament löschen", "Medikament löschen?", "{nome} und alle Erinnerungen werden entfernt.", "💊 Zeit für dein Medikament",
"Nächste: {quando}", "bis {fim}", "heute um {h}", "morgen um {h}", "Behandlung beendet", "g Protein", "g Kohlenhydrate", "Mahlzeit erfassen", "An diesem Tag keine Mahlzeiten. Wähle eine aus:",
"Mahlzeit", "Welche Mahlzeit?", "Name der Mahlzeit (z. B. vor dem Training)", "Uhrzeit", "Foto vom Teller", "Fotografiere deinen Teller, um ihn mit der Mahlzeit zu speichern.", "Kamera", "Galerie", "📸 Foto zur Mahlzeit gespeichert!",
"Wir trainieren die KI von Leviã, Gerichte zu erkennen. Bald erkennt sie, was auf dem Teller ist, und berechnet Kalorien, Protein und Kohlenhydrate automatisch.", "✨ Bald: Die KI von Leviã erkennt diesen Teller und trägt die Lebensmittel für dich ein.", "Keine Berechtigung. Erlaube Kamera/Fotos für Leviã unter Android-Einstellungen > Apps > Leviã > Berechtigungen.", "Was hast du gegessen?", "Lebensmittel oder Rezept suchen (z. B. Reis)", "Hinzufügen", "Nicht gefunden? Werte eingeben", "Name des Lebensmittels",
"Prot. (g)", "KH (g)", "{kcal} kcal · {prot} g Protein · {carb} g KH", "Gesamt: {kcal} kcal · {prot} g Protein · {carb} g KH", "Füge mindestens ein Lebensmittel oder ein Foto hinzu.", "Erinnerung an die nächste Mahlzeit", "{h} Std. nach dieser Mahlzeit erinnern", "Wir erinnern dich in {h} Std. an die nächste Mahlzeit.", "Erinnerung nicht geplant (Zeit vorbei oder Benachrichtigungen blockiert).",
"🍽️ Zeit für die nächste Mahlzeit", "Seit deiner letzten Mahlzeit sind {h} Std. vergangen.", "z. B. wenig gegessen, danach Übelkeit", "Mahlzeit gespeichert ✅", "Mahlzeit löschen", "Diese Mahlzeit löschen?", "Einheit", "Ungültiger Wert. Nur Zahlen (z. B. 12,5).",
"Gib 1 bis 365 Tage ein.", "Gib eine Menge zwischen 1 und 5000 g ein.", "Gib ein Gewicht zwischen 20 und 400 kg ein.", "Heutige Messungen", "Erfassen", "Uhrzeit der Messung", "Notiz (z. B. nüchtern, nach dem Essen)", "Unerwarteter Wert. Zwischen {min} und {max} {u}.",
"Heute keine Messungen. Tippe auf Erfassen.", "Notizen für heute", "Wie fühlst du dich heute?", "Heute keine Notizen.", "App-Version", "Letztes Update", "installierte Version", "Nach Updates suchen", "Suche...",
"Update wird geladen...", "Leviã ist auf dem neuesten Stand ✅", "Update geladen! Tippe unten, um es anzuwenden.", "Anwenden und App neu starten", "Prüfung gerade nicht möglich. Prüfe deine Verbindung und versuche es erneut."]

T['nl'] = ["Toevoegen", "Nog geen medicatie. Tik op Toevoegen voor de eerste.", "Medicijn", "Typ de naam (bv. Azitromycine)", "Typ 3 letters voor suggesties.", "Dosis", "Langdurig gebruik", "Medicijn zonder einddatum.", "Doseerschema",
"elke {h} u", "1x per dag", "1x per week", "Tijd van de 1e dosis", "Elke dag een herinnering om {h}", "Elke week een herinnering, op deze weekdag, om {h}", "Kuur", "Zo nodig",
"Alleen als het nodig is: opgeslagen, zonder herinneringen.", "Duur (dagen)", "Keer per dag", "{n}x", "Start van de kuur", "Tijd van de 1e dosis", "{n} doses · laatste op {fim}", "Herinneringen op de telefoon",
"Een melding bij elke dosis, ook als de app dicht is.", "Toevoegen aan mijn agenda", "Zet de tijden in de agenda van je telefoon (zichtbaar in Google Agenda).", "Notities", "bv. na de lunch innemen", "Vul de naam van het medicijn in.", "Medicijn opgeslagen ✅", "Herinneringen zijn ingepland en gaan ook af als de app dicht is.",
"Herinneringen niet ingepland. Sta meldingen van Leviã toe via Android-instellingen > Apps > Leviã > Meldingen.", "{n} tijd(en) aan je agenda toegevoegd.", "Geen toegang tot de agenda. Sta dit toe via Android-instellingen > Apps > Leviã > Rechten.", "Medicijn verwijderen", "Medicijn verwijderen?", "{nome} en alle herinneringen worden verwijderd.", "💊 Tijd voor je medicijn",
"Volgende: {quando}", "tot {fim}", "vandaag om {h}", "morgen om {h}", "Kuur afgerond", "g eiwit", "g koolhydraten", "Maaltijd registreren", "Geen maaltijden op deze dag. Kies er een om te beginnen:",
"Maaltijd", "Welke maaltijd?", "Naam van de maaltijd (bv. voor het sporten)", "Tijd", "Foto van je bord", "Maak een foto van je bord om bij de maaltijd te bewaren.", "Camera", "Galerij", "📸 Foto bij je maaltijd opgeslagen!",
"We trainen de AI van Leviã om gerechten te herkennen. Binnenkort ziet ze wat er op je bord ligt en berekent ze calorieën, eiwit en koolhydraten automatisch.", "✨ Binnenkort: de AI van Leviã herkent dit bord en vult de voedingsmiddelen voor je in.", "Geen toestemming. Sta camera/foto's van Leviã toe via Android-instellingen > Apps > Leviã > Rechten.", "Wat heb je gegeten?", "Zoek voedsel of recept (bv. rijst)", "Toevoegen", "Niet gevonden? Vul de waarden in", "Naam van het voedingsmiddel",
"eiwit (g)", "kh (g)", "{kcal} kcal · {prot} g eiwit · {carb} g kh", "Totaal: {kcal} kcal · {prot} g eiwit · {carb} g kh", "Voeg minstens één voedingsmiddel of een foto toe.", "Herinnering volgende maaltijd", "Herinner me {h} u na deze maaltijd", "We herinneren je over {h} u aan je volgende maaltijd.", "Herinnering niet ingepland (tijd al voorbij of meldingen geblokkeerd).",
"🍽️ Tijd voor je volgende maaltijd", "Het is {h} u geleden sinds je laatste maaltijd.", "bv. weinig gegeten, daarna misselijk", "Maaltijd opgeslagen ✅", "Maaltijd verwijderen", "Deze maaltijd verwijderen?", "Eenheid", "Ongeldige waarde. Alleen cijfers (bv. 12,5).",
"Vul 1 tot 365 dagen in.", "Vul een hoeveelheid tussen 1 en 5000 g in.", "Vul een gewicht tussen 20 en 400 kg in.", "Metingen van vandaag", "Registreren", "Tijd van de meting", "Notitie (bv. nuchter, na de lunch)", "Onverwachte waarde. Tussen {min} en {max} {u}.",
"Vandaag geen metingen. Tik op Registreren.", "Notities van vandaag", "Hoe voel je je vandaag?", "Vandaag geen notities.", "App-versie", "Laatste update", "geïnstalleerde versie", "Zoeken naar updates", "Zoeken...",
"Update downloaden...", "Leviã is up-to-date ✅", "Update gedownload! Tik hieronder om toe te passen.", "Toepassen en app herstarten", "Controleren lukt nu niet. Check je verbinding en probeer opnieuw."]

T['pl'] = ["Dodaj", "Brak leków. Dotknij Dodaj, aby wpisać pierwszy.", "Lek", "Wpisz nazwę (np. Azytromycyna)", "Wpisz 3 litery, aby zobaczyć podpowiedzi.", "Dawka", "Stałe przyjmowanie", "Lek bez daty zakończenia.", "Dawkowanie",
"co {h} godz.", "1x dziennie", "1x w tygodniu", "Godzina 1. dawki", "Przypomnienia codziennie o {h}", "Przypomnienie co tydzień, w ten dzień, o {h}", "Kuracja", "Doraźnie",
"Tylko w razie potrzeby: zapisany, bez przypomnień.", "Czas trwania (dni)", "Razy dziennie", "{n}x", "Początek kuracji", "Godzina 1. dawki", "{n} dawek · ostatnia {fim}", "Przypomnienia w telefonie",
"Powiadomienie o każdej dawce, nawet gdy aplikacja jest zamknięta.", "Dodaj do mojego kalendarza", "Tworzy terminy w kalendarzu telefonu (widoczne w Kalendarzu Google).", "Uwagi", "np. brać po obiedzie", "Wpisz nazwę leku.", "Lek zapisany ✅", "Przypomnienia zaplanowane — zadzwonią nawet przy zamkniętej aplikacji.",
"Nie zaplanowano przypomnień. Zezwól na powiadomienia Leviã w Ustawienia Androida > Aplikacje > Leviã > Powiadomienia.", "Dodano {n} termin(y) do kalendarza.", "Brak dostępu do kalendarza. Zezwól w Ustawienia Androida > Aplikacje > Leviã > Uprawnienia.", "Usuń lek", "Usunąć lek?", "{nome} i wszystkie przypomnienia zostaną usunięte.", "💊 Pora na lek",
"Następna: {quando}", "do {fim}", "dziś o {h}", "jutro o {h}", "Kuracja zakończona", "g białka", "g węglowodanów", "Zapisz posiłek", "Brak posiłków tego dnia. Wybierz jeden, aby zacząć:",
"Posiłek", "Który posiłek?", "Nazwa posiłku (np. przed treningiem)", "Godzina", "Zdjęcie talerza", "Zrób zdjęcie talerza, aby zapisać je z posiłkiem.", "Aparat", "Galeria", "📸 Zdjęcie zapisane w posiłku!",
"Uczymy AI Leviã rozpoznawać dania. Wkrótce rozpozna, co jest na talerzu, i sama policzy kalorie, białko i węglowodany.", "✨ Wkrótce: AI Leviã rozpozna ten talerz i uzupełni produkty za Ciebie.", "Brak uprawnień. Zezwól na aparat/zdjęcia w Ustawienia Androida > Aplikacje > Leviã > Uprawnienia.", "Co zjadłeś/zjadłaś?", "Szukaj produktu lub przepisu (np. ryż)", "Dodaj", "Nie ma? Wpisz wartości", "Nazwa produktu",
"białko (g)", "węgl. (g)", "{kcal} kcal · {prot} g białka · {carb} g węgl.", "Razem: {kcal} kcal · {prot} g białka · {carb} g węgl.", "Dodaj co najmniej jeden produkt lub zdjęcie.", "Przypomnienie o następnym posiłku", "Przypomnij {h} godz. po tym posiłku", "Przypomnimy o następnym posiłku za {h} godz.", "Nie zaplanowano przypomnienia (czas minął lub powiadomienia są zablokowane).",
"🍽️ Pora na następny posiłek", "Minęło {h} godz. od ostatniego posiłku.", "np. zjadłem/am mało, potem mdłości", "Posiłek zapisany ✅", "Usuń posiłek", "Usunąć ten posiłek?", "Jednostka", "Nieprawidłowa wartość. Tylko liczby (np. 12,5).",
"Wpisz od 1 do 365 dni.", "Wpisz ilość od 1 do 5000 g.", "Wpisz wagę od 20 do 400 kg.", "Dzisiejsze pomiary", "Zapisz", "Godzina pomiaru", "Uwaga (np. na czczo, po obiedzie)", "Nietypowa wartość. Podaj od {min} do {max} {u}.",
"Brak pomiarów dzisiaj. Dotknij Zapisz.", "Notatki na dziś", "Jak się dziś czujesz?", "Brak notatek dzisiaj.", "Wersja aplikacji", "Ostatnia aktualizacja", "wersja zainstalowana", "Sprawdź aktualizacje", "Sprawdzanie...",
"Pobieranie aktualizacji...", "Leviã jest aktualny ✅", "Aktualizacja pobrana! Dotknij poniżej, aby ją zastosować.", "Zastosuj i uruchom ponownie", "Nie udało się sprawdzić. Sprawdź połączenie i spróbuj ponownie."]

T['tr'] = ["Ekle", "Henüz ilaç yok. İlkini eklemek için Ekle'ye dokun.", "İlaç", "Adını yaz (ör. Azitromisin)", "Öneri görmek için 3 harf yaz.", "Doz", "Sürekli kullanım", "Bitiş tarihi olmayan ilaç.", "Kullanım şekli",
"{h} saatte bir", "günde 1 kez", "haftada 1 kez", "1. dozun saati", "Her gün saat {h} hatırlatma", "Her hafta bu günde saat {h} hatırlatma", "Tedavi", "Gerektiğinde",
"Yalnızca gerektiğinde: kaydedilir, hatırlatma yok.", "Süre (gün)", "Günde kaç kez", "{n}x", "Tedavinin başlangıcı", "1. dozun saati", "{n} doz · sonuncusu {fim}", "Telefonda hatırlatmalar",
"Uygulama kapalıyken bile her doz saatinde bildirim.", "Takvimime ekle", "Saatleri telefon takvimine ekler (Google Takvim'de görünür).", "Notlar", "ör. öğle yemeğinden sonra al", "İlacın adını gir.", "İlaç kaydedildi ✅", "Hatırlatmalar planlandı, uygulama kapalıyken de çalar.",
"Hatırlatmalar planlanamadı. Android Ayarları > Uygulamalar > Leviã > Bildirimler'den izin ver.", "Takvime {n} saat eklendi.", "Takvim izni yok. Android Ayarları > Uygulamalar > Leviã > İzinler'den verebilirsin.", "İlacı sil", "İlaç silinsin mi?", "{nome} ve tüm hatırlatmaları silinecek.", "💊 İlaç zamanı",
"Sonraki: {quando}", "{fim} tarihine kadar", "bugün {h}", "yarın {h}", "Tedavi tamamlandı", "g protein", "g karbonhidrat", "Öğün kaydet", "Bu gün öğün yok. Başlamak için birini seç:",
"Öğün", "Hangi öğün?", "Öğün adı (ör. antrenman öncesi)", "Saat", "Tabak fotoğrafı", "Tabağının fotoğrafını çekip öğünle sakla.", "Kamera", "Galeri", "📸 Fotoğraf öğüne kaydedildi!",
"Leviã'nın yapay zekâsını yemekleri tanıması için eğitiyoruz. Yakında tabaktakileri tanıyıp kalori, protein ve karbonhidratı otomatik hesaplayacak.", "✨ Yakında: Leviã'nın yapay zekâsı bu tabağı tanıyıp besinleri senin için dolduracak.", "İzin yok. Android Ayarları > Uygulamalar > Leviã > İzinler'den kamera/fotoğraf izni ver.", "Ne yedin?", "Besin veya tarif ara (ör. pirinç)", "Ekle", "Bulamadın mı? Değerleri gir", "Besin adı",
"prot. (g)", "karb. (g)", "{kcal} kcal · {prot} g protein · {carb} g karb", "Toplam: {kcal} kcal · {prot} g protein · {carb} g karb", "En az bir besin veya fotoğraf ekle.", "Sonraki öğün hatırlatması", "Bu öğünden {h} saat sonra hatırlat", "Sonraki öğününü {h} saat sonra hatırlatacağız.", "Hatırlatma planlanamadı (saat geçti veya bildirimler kapalı).",
"🍽️ Sonraki öğün zamanı", "Son öğününden bu yana {h} saat geçti.", "ör. az yedim, sonra bulantı", "Öğün kaydedildi ✅", "Öğünü sil", "Bu öğün silinsin mi?", "Birim", "Geçersiz değer. Yalnızca sayı kullan (ör. 12,5).",
"1 ile 365 gün arası gir.", "1 ile 5000 g arası bir miktar gir.", "20 ile 400 kg arası bir kilo gir.", "Bugünkü ölçümler", "Kaydet", "Ölçüm saati", "Not (ör. aç karnına, yemekten sonra)", "Beklenmeyen değer. {min} ile {max} {u} arası kullan.",
"Bugün ölçüm yok. Kaydet'e dokun.", "Bugünün notları", "Bugün nasıl hissediyorsun?", "Bugün not yok.", "Uygulama sürümü", "Son güncelleme", "yüklü sürüm", "Güncellemeleri denetle", "Denetleniyor...",
"Güncelleme indiriliyor...", "Leviã güncel ✅", "Güncelleme indirildi! Uygulamak için aşağıya dokun.", "Uygula ve yeniden başlat", "Şu anda denetlenemedi. Bağlantını kontrol edip tekrar dene."]

T['ru'] = ["Добавить", "Лекарств пока нет. Нажмите «Добавить», чтобы внести первое.", "Лекарство", "Введите название (напр.: Азитромицин)", "Введите 3 буквы, чтобы увидеть подсказки.", "Доза", "Постоянный приём", "Лекарство без даты окончания.", "Схема приёма",
"каждые {h} ч", "1 раз в день", "1 раз в неделю", "Время 1-й дозы", "Напоминание каждый день в {h}", "Напоминание каждую неделю, в этот день, в {h}", "Курс лечения", "По необходимости",
"Только по необходимости: сохраняется без напоминаний.", "Длительность (дни)", "Раз в день", "{n}x", "Начало курса", "Время 1-й дозы", "{n} доз · последняя {fim}", "Напоминания на телефоне",
"Уведомление в момент каждой дозы, даже если приложение закрыто.", "Добавить в мой календарь", "Создаёт время приёма в календаре телефона (видно в Google Календаре).", "Заметки", "напр.: принимать после обеда", "Введите название лекарства.", "Лекарство сохранено ✅", "Напоминания запланированы и сработают даже при закрытом приложении.",
"Напоминания не запланированы. Разрешите уведомления Leviã: Настройки Android > Приложения > Leviã > Уведомления.", "Добавлено в календарь: {n}.", "Нет доступа к календарю. Разрешите его: Настройки Android > Приложения > Leviã > Разрешения.", "Удалить лекарство", "Удалить лекарство?", "{nome} и все напоминания будут удалены.", "💊 Время принять лекарство",
"Следующая: {quando}", "до {fim}", "сегодня в {h}", "завтра в {h}", "Курс завершён", "г белка", "г углеводов", "Записать приём пищи", "В этот день записей нет. Выберите, с чего начать:",
"Приём пищи", "Какой приём пищи?", "Название (напр.: перед тренировкой)", "Время", "Фото блюда", "Сфотографируйте тарелку, чтобы сохранить её вместе с записью.", "Камера", "Галерея", "📸 Фото сохранено!",
"Мы обучаем ИИ Leviã распознавать блюда. Скоро он определит, что на тарелке, и сам посчитает калории, белки и углеводы.", "✨ Скоро: ИИ Leviã распознает эту тарелку и заполнит продукты за вас.", "Нет разрешения. Разрешите камеру/фото: Настройки Android > Приложения > Leviã > Разрешения.", "Что вы съели?", "Поиск продукта или рецепта (напр.: рис)", "Добавить", "Не нашли? Введите значения", "Название продукта",
"белки (г)", "углев. (г)", "{kcal} ккал · {prot} г белка · {carb} г углев.", "Итого: {kcal} ккал · {prot} г белка · {carb} г углев.", "Добавьте хотя бы один продукт или фото.", "Напоминание о следующем приёме пищи", "Напомнить через {h} ч после этого приёма", "Напомним о следующем приёме пищи через {h} ч.", "Напоминание не запланировано (время прошло или уведомления заблокированы).",
"🍽️ Пора поесть", "С последнего приёма пищи прошло {h} ч.", "напр.: съел(а) мало, потом тошнота", "Запись сохранена ✅", "Удалить запись", "Удалить этот приём пищи?", "Единица", "Неверное значение. Только цифры (напр.: 12,5).",
"Укажите от 1 до 365 дней.", "Укажите количество от 1 до 5000 г.", "Укажите вес от 20 до 400 кг.", "Измерения сегодня", "Записать", "Время измерения", "Заметка (напр.: натощак, после обеда)", "Необычное значение. Допустимо от {min} до {max} {u}.",
"Сегодня измерений нет. Нажмите «Записать».", "Заметки за сегодня", "Как вы себя чувствуете сегодня?", "Сегодня заметок нет.", "Версия приложения", "Последнее обновление", "установленная версия", "Проверить обновления", "Проверка...",
"Загрузка обновления...", "У вас последняя версия Leviã ✅", "Обновление загружено! Нажмите ниже, чтобы применить.", "Применить и перезапустить", "Сейчас не удалось проверить. Проверьте подключение и повторите."]

T['ja'] = ["追加", "お薬はまだありません。「追加」から登録しましょう。", "お薬", "名前を入力（例：アジスロマイシン）", "3文字入力すると候補が表示されます。", "用量", "継続して服用", "終了日のないお薬です。", "服用方法",
"{h}時間ごと", "1日1回", "週1回", "1回目の服用時刻", "毎日 {h} にリマインド", "毎週この曜日の {h} にリマインド", "治療（期間あり）", "必要時のみ",
"必要なときだけ服用：記録のみでリマインドなし。", "期間（日数）", "1日の回数", "{n}回", "治療の開始日", "1回目の服用時刻", "{n}回分 · 最終 {fim}", "スマホのリマインダー",
"アプリを閉じていても、服用時刻に通知します。", "カレンダーに追加", "スマホのカレンダーに時刻を登録します（Googleカレンダーにも表示）。", "メモ", "例：昼食後に飲む", "お薬の名前を入力してください。", "保存しました ✅", "リマインダーを設定しました。アプリを閉じていても通知されます。",
"リマインダーを設定できませんでした。Android設定 > アプリ > Leviã > 通知 で許可してください。", "カレンダーに {n} 件追加しました。", "カレンダーの権限がありません。Android設定 > アプリ > Leviã > 権限 で許可できます。", "お薬を削除", "このお薬を削除しますか？", "{nome} とすべてのリマインダーを削除します。", "💊 お薬の時間です",
"次回：{quando}", "{fim} まで", "今日 {h}", "明日 {h}", "治療完了", "g たんぱく質", "g 炭水化物", "食事を記録", "この日の食事はまだありません。どれから記録しますか：",
"食事", "どの食事ですか？", "食事の名前（例：運動前）", "時刻", "料理の写真", "料理の写真を撮って食事と一緒に保存します。", "カメラ", "ギャラリー", "📸 写真を食事に保存しました！",
"LeviãのAIが料理を認識できるよう学習中です。まもなく、お皿の中身を判別してカロリー・たんぱく質・炭水化物を自動で計算します。", "✨ まもなく：LeviãのAIがこの料理を認識して食品を入力します。", "権限がありません。Android設定 > アプリ > Leviã > 権限 でカメラ/写真を許可してください。", "何を食べましたか？", "食品やレシピを検索（例：ごはん）", "追加", "見つからない？数値を入力", "食品名",
"たんぱく質 (g)", "炭水化物 (g)", "{kcal} kcal · たんぱく質 {prot} g · 炭水化物 {carb} g", "合計：{kcal} kcal · たんぱく質 {prot} g · 炭水化物 {carb} g", "食品か写真を1つ以上追加してください。", "次の食事のリマインダー", "この食事の {h} 時間後に通知", "{h} 時間後に次の食事をお知らせします。", "リマインダーを設定できませんでした（時刻が過ぎたか通知がオフです）。",
"🍽️ 次の食事の時間です", "最後の食事から {h} 時間たちました。", "例：少ししか食べられず、後で吐き気", "保存しました ✅", "食事を削除", "この食事を削除しますか？", "単位", "無効な値です。数字のみ（例：12.5）。",
"1〜365日で入力してください。", "1〜5000 g で入力してください。", "20〜400 kg で入力してください。", "今日の測定", "記録", "測定時刻", "メモ（例：空腹時、昼食後）", "想定外の値です。{min}〜{max} {u} で入力してください。",
"今日の測定はまだありません。「記録」をタップ。", "今日のメモ", "今日の調子はどうですか？", "今日のメモはありません。", "アプリのバージョン", "最終アップデート", "インストール時のバージョン", "アップデートを確認", "確認中...",
"ダウンロード中...", "Leviãは最新です ✅", "アップデートをダウンロードしました！下をタップして適用します。", "適用して再起動", "今は確認できませんでした。接続を確認して再試行してください。"]

T['ko'] = ["추가", "아직 약이 없어요. 추가를 눌러 첫 약을 등록하세요.", "약", "이름 입력 (예: 아지트로마이신)", "3글자를 입력하면 추천이 나와요.", "용량", "지속 복용", "종료일이 없는 약이에요.", "복용 방법",
"{h}시간마다", "하루 1회", "주 1회", "첫 복용 시간", "매일 {h}에 알림", "매주 이 요일 {h}에 알림", "치료(기간)", "필요할 때",
"필요할 때만 복용: 기록만 하고 알림은 없어요.", "기간(일)", "하루 횟수", "{n}회", "치료 시작일", "첫 복용 시간", "{n}회 · 마지막 {fim}", "휴대폰 알림",
"앱을 닫아도 복용 시간마다 알림을 보내요.", "내 캘린더에 추가", "휴대폰 캘린더에 시간을 등록해요 (Google 캘린더에도 표시).", "메모", "예: 점심 식사 후 복용", "약 이름을 입력하세요.", "저장했어요 ✅", "알림을 예약했어요. 앱을 닫아도 울려요.",
"알림을 예약하지 못했어요. Android 설정 > 앱 > Leviã > 알림에서 허용하세요.", "캘린더에 {n}개를 추가했어요.", "캘린더 권한이 없어요. Android 설정 > 앱 > Leviã > 권한에서 허용할 수 있어요.", "약 삭제", "약을 삭제할까요?", "{nome}와(과) 모든 알림이 삭제돼요.", "💊 약 먹을 시간이에요",
"다음: {quando}", "{fim}까지", "오늘 {h}", "내일 {h}", "치료 완료", "g 단백질", "g 탄수화물", "식사 기록", "이 날은 식사 기록이 없어요. 하나를 골라 시작하세요:",
"식사", "어떤 식사인가요?", "식사 이름 (예: 운동 전)", "시간", "음식 사진", "음식 사진을 찍어 식사와 함께 저장하세요.", "카메라", "갤러리", "📸 사진을 식사에 저장했어요!",
"Leviã의 AI가 음식을 알아보도록 학습 중이에요. 곧 접시에 무엇이 있는지 알아보고 칼로리, 단백질, 탄수화물을 자동으로 계산해 줄 거예요.", "✨ 곧 출시: Leviã의 AI가 이 음식을 알아보고 식품을 채워 드려요.", "권한이 없어요. Android 설정 > 앱 > Leviã > 권한에서 카메라/사진을 허용하세요.", "무엇을 드셨나요?", "식품 또는 레시피 검색 (예: 밥)", "추가", "찾을 수 없나요? 값을 직접 입력", "식품 이름",
"단백질 (g)", "탄수 (g)", "{kcal} kcal · 단백질 {prot} g · 탄수 {carb} g", "합계: {kcal} kcal · 단백질 {prot} g · 탄수 {carb} g", "식품이나 사진을 하나 이상 추가하세요.", "다음 식사 알림", "이 식사 {h}시간 후 알림", "{h}시간 후 다음 식사를 알려 드릴게요.", "알림을 예약하지 못했어요 (시간이 지났거나 알림이 차단됨).",
"🍽️ 다음 식사 시간이에요", "마지막 식사 후 {h}시간이 지났어요.", "예: 조금 먹음, 이후 메스꺼움", "저장했어요 ✅", "식사 삭제", "이 식사를 삭제할까요?", "단위", "잘못된 값이에요. 숫자만 입력하세요 (예: 12.5).",
"1~365일을 입력하세요.", "1~5000 g 사이로 입력하세요.", "20~400 kg 사이로 입력하세요.", "오늘의 측정", "기록", "측정 시간", "메모 (예: 공복, 점심 후)", "예상 밖의 값이에요. {min}~{max} {u} 사이로 입력하세요.",
"오늘 측정이 없어요. 기록을 누르세요.", "오늘의 메모", "오늘 기분은 어떠세요?", "오늘 메모가 없어요.", "앱 버전", "최근 업데이트", "설치된 버전", "업데이트 확인", "확인 중...",
"업데이트 다운로드 중...", "Leviã가 최신 버전이에요 ✅", "업데이트를 받았어요! 아래를 눌러 적용하세요.", "적용 후 앱 다시 시작", "지금은 확인할 수 없어요. 연결을 확인하고 다시 시도하세요."]

T['zh-CN'] = ["添加", "还没有药物。点“添加”录入第一个。", "药物", "输入名称（例如：阿奇霉素）", "输入 3 个字母查看建议。", "剂量", "长期服用", "没有结束日期的药物。", "用法",
"每 {h} 小时", "每天 1 次", "每周 1 次", "首剂时间", "每天 {h} 提醒", "每周这一天的 {h} 提醒", "疗程", "按需",
"仅在需要时服用：只记录，不提醒。", "疗程（天）", "每天次数", "{n}次", "疗程开始", "首剂时间", "共 {n} 剂 · 最后一剂 {fim}", "手机提醒",
"即使关闭应用，也会在每次服药时通知。", "添加到我的日历", "在手机日历中创建服药时间（Google 日历中可见）。", "备注", "例如：午饭后服用", "请输入药物名称。", "药物已保存 ✅", "提醒已设置，关闭应用也会响起。",
"未能设置提醒。请在 Android 设置 > 应用 > Leviã > 通知 中允许通知。", "已向日历添加 {n} 个时间。", "没有日历权限。可在 Android 设置 > 应用 > Leviã > 权限 中开启。", "删除药物", "删除此药物？", "{nome} 及其所有提醒将被删除。", "💊 该吃药了",
"下一次：{quando}", "至 {fim}", "今天 {h}", "明天 {h}", "疗程已结束", "克蛋白质", "克碳水", "记录一餐", "这一天还没有记录。选择一项开始：",
"餐次", "哪一餐？", "餐次名称（例如：运动前）", "时间", "餐盘照片", "拍下餐盘，与这一餐一起保存。", "相机", "相册", "📸 照片已保存到这一餐！",
"我们正在训练 Leviã 的 AI 识别菜品。很快它就能识别盘中食物，并自动计算热量、蛋白质和碳水。", "✨ 即将推出：Leviã 的 AI 会识别这盘菜并为你填写食物。", "没有权限。请在 Android 设置 > 应用 > Leviã > 权限 中允许相机/照片。", "你吃了什么？", "搜索食物或食谱（例如：米饭）", "添加", "找不到？手动输入数值", "食物名称",
"蛋白质 (克)", "碳水 (克)", "{kcal} 千卡 · 蛋白质 {prot} 克 · 碳水 {carb} 克", "合计：{kcal} 千卡 · 蛋白质 {prot} 克 · 碳水 {carb} 克", "请至少添加一种食物或一张照片。", "下一餐提醒", "这一餐后 {h} 小时提醒我", "我们会在 {h} 小时后提醒你下一餐。", "未能设置提醒（时间已过或通知被关闭）。",
"🍽️ 该吃下一餐了", "距离上一餐已过 {h} 小时。", "例如：吃得少，之后恶心", "已保存 ✅", "删除这一餐", "删除这一餐？", "单位", "数值无效。只能输入数字（例如 12.5）。",
"请输入 1 到 365 天。", "请输入 1 到 5000 克之间的数量。", "请输入 20 到 400 公斤之间的体重。", "今天的测量", "记录", "测量时间", "备注（例如：空腹、午饭后）", "数值异常。请输入 {min} 到 {max} {u}。",
"今天还没有测量。点“记录”。", "今天的笔记", "今天感觉怎么样？", "今天没有笔记。", "应用版本", "最近更新", "安装时的版本", "检查更新", "正在检查...",
"正在下载更新...", "Leviã 已是最新版本 ✅", "更新已下载！点下方应用。", "应用并重启", "暂时无法检查。请检查网络后重试。"]

T['id'] = ["Tambah", "Belum ada obat. Ketuk Tambah untuk memasukkan yang pertama.", "Obat", "Ketik nama (mis. Azitromisin)", "Ketik 3 huruf untuk melihat saran.", "Dosis", "Pemakaian rutin", "Obat tanpa tanggal selesai.", "Aturan pakai",
"tiap {h} jam", "1x sehari", "1x seminggu", "Jam dosis pertama", "Pengingat setiap hari pukul {h}", "Pengingat setiap minggu, di hari ini, pukul {h}", "Pengobatan", "Bila perlu",
"Hanya bila perlu: tersimpan tanpa pengingat.", "Lama (hari)", "Kali sehari", "{n}x", "Mulai pengobatan", "Jam dosis pertama", "{n} dosis · terakhir {fim}", "Pengingat di ponsel",
"Notifikasi di setiap jam dosis, meski aplikasi ditutup.", "Tambahkan ke kalender saya", "Membuat jadwal di kalender ponsel (muncul di Google Kalender).", "Catatan", "mis. diminum setelah makan siang", "Masukkan nama obat.", "Obat tersimpan ✅", "Pengingat sudah dijadwalkan dan berbunyi meski aplikasi ditutup.",
"Pengingat tidak terjadwal. Izinkan notifikasi Leviã di Setelan Android > Aplikasi > Leviã > Notifikasi.", "{n} jadwal ditambahkan ke kalender.", "Tidak ada izin kalender. Izinkan di Setelan Android > Aplikasi > Leviã > Izin.", "Hapus obat", "Hapus obat ini?", "{nome} dan semua pengingatnya akan dihapus.", "💊 Waktunya minum obat",
"Berikutnya: {quando}", "sampai {fim}", "hari ini pukul {h}", "besok pukul {h}", "Pengobatan selesai", "g protein", "g karbohidrat", "Catat makanan", "Belum ada makanan di hari ini. Pilih satu untuk mulai:",
"Makanan", "Makan yang mana?", "Nama makanan (mis. sebelum olahraga)", "Jam", "Foto piring", "Foto piringmu untuk disimpan bersama catatan makan.", "Kamera", "Galeri", "📸 Foto tersimpan!",
"Kami sedang melatih AI Leviã mengenali hidangan. Sebentar lagi AI akan mengenali isi piring dan menghitung kalori, protein, dan karbohidrat otomatis.", "✨ Segera hadir: AI Leviã akan mengenali piring ini dan mengisi makanannya untukmu.", "Tidak ada izin. Izinkan kamera/foto Leviã di Setelan Android > Aplikasi > Leviã > Izin.", "Apa yang kamu makan?", "Cari makanan atau resep (mis. nasi)", "Tambah", "Tidak ketemu? Isi nilainya", "Nama makanan",
"prot. (g)", "karb. (g)", "{kcal} kkal · {prot} g protein · {carb} g karb", "Total: {kcal} kkal · {prot} g protein · {carb} g karb", "Tambahkan minimal satu makanan atau foto.", "Pengingat makan berikutnya", "Ingatkan {h} jam setelah makan ini", "Kami akan mengingatkan makan berikutnya dalam {h} jam.", "Pengingat tidak terjadwal (waktu sudah lewat atau notifikasi diblokir).",
"🍽️ Waktunya makan berikutnya", "Sudah {h} jam sejak makan terakhir.", "mis. makan sedikit, lalu mual", "Tersimpan ✅", "Hapus catatan makan", "Hapus catatan makan ini?", "Satuan", "Nilai tidak valid. Gunakan angka saja (mis. 12,5).",
"Isi 1 sampai 365 hari.", "Isi jumlah antara 1 dan 5000 g.", "Isi berat antara 20 dan 400 kg.", "Pengukuran hari ini", "Catat", "Jam pengukuran", "Catatan (mis. puasa, setelah makan siang)", "Nilai tidak biasa. Gunakan antara {min} dan {max} {u}.",
"Belum ada pengukuran hari ini. Ketuk Catat.", "Catatan hari ini", "Bagaimana perasaanmu hari ini?", "Belum ada catatan hari ini.", "Versi aplikasi", "Pembaruan terakhir", "versi terpasang", "Cek pembaruan", "Mengecek...",
"Mengunduh pembaruan...", "Leviã sudah versi terbaru ✅", "Pembaruan terunduh! Ketuk di bawah untuk menerapkan.", "Terapkan dan mulai ulang", "Belum bisa mengecek. Periksa koneksi dan coba lagi."]

T['vi'] = ["Thêm", "Chưa có thuốc nào. Chạm Thêm để nhập thuốc đầu tiên.", "Thuốc", "Nhập tên (vd: Azithromycin)", "Nhập 3 chữ để xem gợi ý.", "Liều", "Dùng lâu dài", "Thuốc không có ngày kết thúc.", "Cách dùng",
"mỗi {h} giờ", "1 lần/ngày", "1 lần/tuần", "Giờ uống liều đầu", "Nhắc mỗi ngày lúc {h}", "Nhắc mỗi tuần, vào thứ này, lúc {h}", "Đợt điều trị", "Khi cần",
"Chỉ dùng khi cần: được lưu, không nhắc.", "Thời gian (ngày)", "Số lần/ngày", "{n} lần", "Bắt đầu điều trị", "Giờ uống liều đầu", "{n} liều · liều cuối {fim}", "Nhắc trên điện thoại",
"Thông báo vào mỗi giờ uống, kể cả khi đóng ứng dụng.", "Thêm vào lịch của tôi", "Tạo giờ uống trong lịch điện thoại (hiện trên Google Lịch).", "Ghi chú", "vd: uống sau bữa trưa", "Hãy nhập tên thuốc.", "Đã lưu thuốc ✅", "Đã đặt nhắc nhở, sẽ báo kể cả khi đóng ứng dụng.",
"Chưa đặt được nhắc. Cho phép thông báo của Leviã trong Cài đặt Android > Ứng dụng > Leviã > Thông báo.", "Đã thêm {n} giờ vào lịch.", "Không có quyền lịch. Bạn có thể cấp trong Cài đặt Android > Ứng dụng > Leviã > Quyền.", "Xóa thuốc", "Xóa thuốc này?", "{nome} và mọi nhắc nhở sẽ bị xóa.", "💊 Đến giờ uống thuốc",
"Tiếp theo: {quando}", "đến {fim}", "hôm nay lúc {h}", "ngày mai lúc {h}", "Đã hoàn thành đợt điều trị", "g protein", "g carb", "Ghi bữa ăn", "Chưa có bữa ăn nào trong ngày. Chọn một để bắt đầu:",
"Bữa ăn", "Bữa nào?", "Tên bữa ăn (vd: trước tập)", "Giờ", "Ảnh món ăn", "Chụp ảnh đĩa ăn để lưu cùng bữa.", "Máy ảnh", "Thư viện", "📸 Đã lưu ảnh vào bữa ăn!",
"Chúng tôi đang huấn luyện AI của Leviã nhận diện món ăn. Sắp tới AI sẽ nhận biết món trên đĩa và tự tính calo, protein và carb.", "✨ Sắp có: AI của Leviã sẽ nhận diện đĩa ăn này và điền thực phẩm cho bạn.", "Không có quyền. Cho phép máy ảnh/ảnh của Leviã trong Cài đặt Android > Ứng dụng > Leviã > Quyền.", "Bạn đã ăn gì?", "Tìm thực phẩm hoặc công thức (vd: cơm)", "Thêm", "Không thấy? Nhập giá trị", "Tên thực phẩm",
"protein (g)", "carb (g)", "{kcal} kcal · {prot} g protein · {carb} g carb", "Tổng: {kcal} kcal · {prot} g protein · {carb} g carb", "Thêm ít nhất một thực phẩm hoặc một ảnh.", "Nhắc bữa tiếp theo", "Nhắc tôi {h} giờ sau bữa này", "Chúng tôi sẽ nhắc bữa tiếp theo sau {h} giờ.", "Chưa đặt được nhắc (đã quá giờ hoặc thông báo bị chặn).",
"🍽️ Đến giờ bữa tiếp theo", "Đã {h} giờ kể từ bữa ăn gần nhất.", "vd: ăn ít, sau đó buồn nôn", "Đã lưu ✅", "Xóa bữa ăn", "Xóa bữa ăn này?", "Đơn vị", "Giá trị không hợp lệ. Chỉ dùng số (vd: 12,5).",
"Nhập từ 1 đến 365 ngày.", "Nhập lượng từ 1 đến 5000 g.", "Nhập cân nặng từ 20 đến 400 kg.", "Lần đo hôm nay", "Ghi", "Giờ đo", "Ghi chú (vd: lúc đói, sau bữa trưa)", "Giá trị bất thường. Dùng từ {min} đến {max} {u}.",
"Hôm nay chưa đo. Chạm Ghi.", "Ghi chú hôm nay", "Hôm nay bạn thấy thế nào?", "Hôm nay chưa có ghi chú.", "Phiên bản ứng dụng", "Cập nhật gần nhất", "bản đã cài", "Kiểm tra cập nhật", "Đang kiểm tra...",
"Đang tải bản cập nhật...", "Leviã đã là bản mới nhất ✅", "Đã tải bản cập nhật! Chạm bên dưới để áp dụng.", "Áp dụng và khởi động lại", "Chưa kiểm tra được. Hãy xem lại kết nối và thử lại."]

T['th'] = ["เพิ่ม", "ยังไม่มียา แตะ เพิ่ม เพื่อบันทึกยาตัวแรก", "ยา", "พิมพ์ชื่อ (เช่น อะซิโทรมัยซิน)", "พิมพ์ 3 ตัวอักษรเพื่อดูคำแนะนำ", "ขนาดยา", "ใช้ต่อเนื่อง", "ยาที่ไม่มีวันสิ้นสุด", "วิธีใช้",
"ทุก {h} ชม.", "วันละครั้ง", "สัปดาห์ละครั้ง", "เวลาของยาเม็ดแรก", "เตือนทุกวัน เวลา {h}", "เตือนทุกสัปดาห์ในวันนี้ เวลา {h}", "การรักษา", "เมื่อจำเป็น",
"ใช้เฉพาะเมื่อจำเป็น: บันทึกไว้โดยไม่เตือน", "ระยะเวลา (วัน)", "ครั้งต่อวัน", "{n} ครั้ง", "เริ่มการรักษา", "เวลาของยาเม็ดแรก", "{n} ครั้ง · ครั้งสุดท้าย {fim}", "การเตือนในโทรศัพท์",
"แจ้งเตือนทุกเวลาที่ต้องใช้ยา แม้ปิดแอป", "เพิ่มลงในปฏิทินของฉัน", "สร้างเวลาในปฏิทินของโทรศัพท์ (แสดงใน Google ปฏิทิน)", "หมายเหตุ", "เช่น ทานหลังอาหารกลางวัน", "กรอกชื่อยา", "บันทึกยาแล้ว ✅", "ตั้งการเตือนแล้ว จะดังแม้ปิดแอป",
"ตั้งการเตือนไม่ได้ อนุญาตการแจ้งเตือนของ Leviã ใน การตั้งค่า Android > แอป > Leviã > การแจ้งเตือน", "เพิ่ม {n} เวลาในปฏิทินแล้ว", "ไม่มีสิทธิ์ปฏิทิน อนุญาตได้ใน การตั้งค่า Android > แอป > Leviã > สิทธิ์", "ลบยา", "ลบยานี้ไหม?", "{nome} และการเตือนทั้งหมดจะถูกลบ", "💊 ถึงเวลาใช้ยา",
"ถัดไป: {quando}", "ถึง {fim}", "วันนี้ {h}", "พรุ่งนี้ {h}", "การรักษาเสร็จสิ้น", "ก. โปรตีน", "ก. คาร์บ", "บันทึกมื้ออาหาร", "ยังไม่มีมื้ออาหารในวันนี้ เลือกหนึ่งมื้อเพื่อเริ่ม:",
"มื้ออาหาร", "มื้อไหน?", "ชื่อมื้อ (เช่น ก่อนออกกำลังกาย)", "เวลา", "รูปจานอาหาร", "ถ่ายรูปจานอาหารเพื่อเก็บไว้กับมื้อนี้", "กล้อง", "แกลเลอรี", "📸 บันทึกรูปในมื้ออาหารแล้ว!",
"เรากำลังฝึก AI ของ Leviã ให้จำแนกอาหาร อีกไม่นาน AI จะรู้ว่ามีอะไรในจานและคำนวณแคลอรี โปรตีน และคาร์บให้อัตโนมัติ", "✨ เร็ว ๆ นี้: AI ของ Leviã จะจำจานนี้และกรอกรายการอาหารให้คุณ", "ไม่มีสิทธิ์ อนุญาตกล้อง/รูปภาพของ Leviã ใน การตั้งค่า Android > แอป > Leviã > สิทธิ์", "คุณกินอะไรไป?", "ค้นหาอาหารหรือสูตร (เช่น ข้าว)", "เพิ่ม", "หาไม่เจอ? กรอกค่าเอง", "ชื่ออาหาร",
"โปรตีน (ก.)", "คาร์บ (ก.)", "{kcal} kcal · โปรตีน {prot} ก. · คาร์บ {carb} ก.", "รวม: {kcal} kcal · โปรตีน {prot} ก. · คาร์บ {carb} ก.", "เพิ่มอาหารหรือรูปอย่างน้อยหนึ่งรายการ", "เตือนมื้อถัดไป", "เตือนฉัน {h} ชม. หลังมื้อนี้", "เราจะเตือนมื้อถัดไปในอีก {h} ชม.", "ตั้งการเตือนไม่ได้ (เลยเวลาแล้วหรือปิดการแจ้งเตือน)",
"🍽️ ได้เวลามื้อถัดไป", "ผ่านไป {h} ชม. แล้วตั้งแต่มื้อล่าสุด", "เช่น กินน้อย แล้วคลื่นไส้", "บันทึกแล้ว ✅", "ลบมื้ออาหาร", "ลบมื้อนี้ไหม?", "หน่วย", "ค่าไม่ถูกต้อง ใช้ตัวเลขเท่านั้น (เช่น 12.5)",
"กรอก 1 ถึง 365 วัน", "กรอกปริมาณระหว่าง 1 ถึง 5000 ก.", "กรอกน้ำหนักระหว่าง 20 ถึง 400 กก.", "การวัดวันนี้", "บันทึก", "เวลาที่วัด", "หมายเหตุ (เช่น ตอนอดอาหาร หลังอาหารกลางวัน)", "ค่าผิดปกติ ใช้ระหว่าง {min} ถึง {max} {u}",
"วันนี้ยังไม่ได้วัด แตะ บันทึก", "บันทึกของวันนี้", "วันนี้รู้สึกอย่างไรบ้าง?", "วันนี้ยังไม่มีบันทึก", "เวอร์ชันแอป", "อัปเดตล่าสุด", "เวอร์ชันที่ติดตั้ง", "ตรวจหาอัปเดต", "กำลังตรวจสอบ...",
"กำลังดาวน์โหลดอัปเดต...", "Leviã เป็นเวอร์ชันล่าสุดแล้ว ✅", "ดาวน์โหลดอัปเดตแล้ว! แตะด้านล่างเพื่อใช้งาน", "ใช้งานและรีสตาร์ทแอป", "ตอนนี้ตรวจสอบไม่ได้ ตรวจการเชื่อมต่อแล้วลองใหม่"]

T['hi'] = ["जोड़ें", "अभी कोई दवा नहीं। पहली दवा के लिए जोड़ें पर टैप करें।", "दवा", "नाम लिखें (जैसे: एज़िथ्रोमाइसिन)", "सुझाव देखने के लिए 3 अक्षर लिखें।", "खुराक", "लगातार उपयोग", "बिना अंतिम तारीख वाली दवा।", "लेने का तरीका",
"हर {h} घंटे", "दिन में 1 बार", "हफ़्ते में 1 बार", "पहली खुराक का समय", "हर दिन {h} बजे रिमाइंडर", "हर हफ़्ते इसी दिन {h} बजे रिमाइंडर", "इलाज (कोर्स)", "ज़रूरत पर",
"सिर्फ़ ज़रूरत पर: सेव होती है, रिमाइंडर नहीं।", "अवधि (दिन)", "दिन में कितनी बार", "{n} बार", "इलाज की शुरुआत", "पहली खुराक का समय", "{n} खुराक · आख़िरी {fim}", "फ़ोन पर रिमाइंडर",
"हर खुराक के समय सूचना, ऐप बंद होने पर भी।", "मेरे कैलेंडर में जोड़ें", "फ़ोन कैलेंडर में समय बनाता है (Google कैलेंडर में दिखता है)।", "नोट", "जैसे: दोपहर के खाने के बाद लें", "दवा का नाम लिखें।", "दवा सेव हुई ✅", "रिमाइंडर सेट हैं और ऐप बंद होने पर भी बजेंगे।",
"रिमाइंडर सेट नहीं हुए। Android सेटिंग > ऐप्स > Leviã > सूचनाएँ में अनुमति दें।", "कैलेंडर में {n} समय जोड़े गए।", "कैलेंडर की अनुमति नहीं है। Android सेटिंग > ऐप्स > Leviã > अनुमतियाँ में दें।", "दवा हटाएँ", "दवा हटाएँ?", "{nome} और उसके सभी रिमाइंडर हट जाएँगे।", "💊 दवा का समय",
"अगली: {quando}", "{fim} तक", "आज {h} बजे", "कल {h} बजे", "इलाज पूरा", "g प्रोटीन", "g कार्ब", "भोजन दर्ज करें", "इस दिन कोई भोजन दर्ज नहीं। शुरू करने के लिए एक चुनें:",
"भोजन", "कौन-सा भोजन?", "भोजन का नाम (जैसे: वर्कआउट से पहले)", "समय", "थाली की फ़ोटो", "भोजन के साथ रखने के लिए थाली की फ़ोटो लें।", "कैमरा", "गैलरी", "📸 फ़ोटो भोजन में सेव हुई!",
"हम Leviã की AI को खाना पहचानना सिखा रहे हैं। जल्द ही यह थाली में क्या है पहचानकर कैलोरी, प्रोटीन और कार्ब अपने आप गिनेगी।", "✨ जल्द आ रहा है: Leviã की AI इस थाली को पहचानकर खाना भर देगी।", "अनुमति नहीं। Android सेटिंग > ऐप्स > Leviã > अनुमतियाँ में कैमरा/फ़ोटो की अनुमति दें।", "आपने क्या खाया?", "खाना या रेसिपी खोजें (जैसे: चावल)", "जोड़ें", "नहीं मिला? मान लिखें", "खाने का नाम",
"प्रोटीन (g)", "कार्ब (g)", "{kcal} kcal · {prot} g प्रोटीन · {carb} g कार्ब", "कुल: {kcal} kcal · {prot} g प्रोटीन · {carb} g कार्ब", "कम से कम एक खाना या फ़ोटो जोड़ें।", "अगले भोजन का रिमाइंडर", "इस भोजन के {h} घंटे बाद याद दिलाएँ", "हम {h} घंटे बाद अगले भोजन की याद दिलाएँगे।", "रिमाइंडर सेट नहीं हुआ (समय बीत गया या सूचनाएँ बंद हैं)।",
"🍽️ अगले भोजन का समय", "पिछले भोजन को {h} घंटे हो गए।", "जैसे: कम खाया, बाद में मतली", "सेव हुआ ✅", "भोजन हटाएँ", "यह भोजन हटाएँ?", "इकाई", "अमान्य मान। सिर्फ़ अंक लिखें (जैसे 12.5)।",
"1 से 365 दिन लिखें।", "1 से 5000 g के बीच मात्रा लिखें।", "20 से 400 kg के बीच वज़न लिखें।", "आज के माप", "दर्ज करें", "माप का समय", "नोट (जैसे: खाली पेट, खाने के बाद)", "असामान्य मान। {min} से {max} {u} के बीच लिखें।",
"आज कोई माप नहीं। दर्ज करें पर टैप करें।", "आज के नोट", "आज आप कैसा महसूस कर रहे हैं?", "आज कोई नोट नहीं।", "ऐप वर्ज़न", "आख़िरी अपडेट", "इंस्टॉल किया गया वर्ज़न", "अपडेट जाँचें", "जाँच हो रही है...",
"अपडेट डाउनलोड हो रहा है...", "Leviã अप-टू-डेट है ✅", "अपडेट डाउनलोड हो गया! लागू करने के लिए नीचे टैप करें।", "लागू करें और ऐप फिर से शुरू करें", "अभी जाँच नहीं हो सकी। कनेक्शन देखकर फिर कोशिश करें।"]

T['ar'] = ["إضافة", "لا توجد أدوية بعد. اضغط إضافة لإدخال أول دواء.", "الدواء", "اكتب الاسم (مثل: أزيثromycin)".replace("أزيثromycin", "أزيثرومايسين"), "اكتب 3 أحرف لرؤية الاقتراحات.", "الجرعة", "استخدام مستمر", "دواء بلا تاريخ انتهاء.", "طريقة الاستخدام",
"كل {h} ساعات", "مرة يوميًا", "مرة أسبوعيًا", "وقت الجرعة الأولى", "تذكير يوميًا الساعة {h}", "تذكير أسبوعيًا في هذا اليوم الساعة {h}", "علاج لفترة", "عند الحاجة",
"يؤخذ عند الحاجة فقط: يُحفظ دون تذكير.", "المدة (أيام)", "مرات في اليوم", "{n} مرات", "بداية العلاج", "وقت الجرعة الأولى", "{n} جرعات · الأخيرة {fim}", "تذكيرات على الهاتف",
"إشعار في وقت كل جرعة حتى مع إغلاق التطبيق.", "أضف إلى تقويمي", "ينشئ المواعيد في تقويم الهاتف (يظهر في تقويم Google).", "ملاحظات", "مثل: بعد الغداء", "أدخل اسم الدواء.", "تم حفظ الدواء ✅", "تمت جدولة التذكيرات وستعمل حتى مع إغلاق التطبيق.",
"لم تُجدول التذكيرات. اسمح بإشعارات Leviã من إعدادات Android > التطبيقات > Leviã > الإشعارات.", "تمت إضافة {n} موعد إلى التقويم.", "لا يوجد إذن للتقويم. يمكنك السماح به من إعدادات Android > التطبيقات > Leviã > الأذونات.", "حذف الدواء", "حذف الدواء؟", "سيتم حذف {nome} وكل تذكيراته.", "💊 حان وقت الدواء",
"التالية: {quando}", "حتى {fim}", "اليوم الساعة {h}", "غدًا الساعة {h}", "انتهى العلاج", "غ بروتين", "غ كربوهيدرات", "سجّل وجبة", "لا توجد وجبات في هذا اليوم. اختر واحدة للبدء:",
"الوجبة", "أي وجبة؟", "اسم الوجبة (مثل: قبل التمرين)", "الوقت", "صورة الطبق", "صوّر طبقك لحفظه مع الوجبة.", "الكاميرا", "المعرض", "📸 تم حفظ الصورة في الوجبة!",
"نحن ندرّب ذكاء Leviã الاصطناعي على التعرف على الأطباق. قريبًا سيتعرف على محتوى الطبق ويحسب السعرات والبروتين والكربوهيدرات تلقائيًا.", "✨ قريبًا: سيتعرف ذكاء Leviã على هذا الطبق ويملأ الأطعمة نيابة عنك.", "لا يوجد إذن. اسمح للكاميرا/الصور من إعدادات Android > التطبيقات > Leviã > الأذونات.", "ماذا أكلت؟", "ابحث عن طعام أو وصفة (مثل: أرز)", "إضافة", "لم تجده؟ أدخل القيم", "اسم الطعام",
"بروتين (غ)", "كربوهيدرات (غ)", "{kcal} سعرة · {prot} غ بروتين · {carb} غ كربوهيدرات", "المجموع: {kcal} سعرة · {prot} غ بروتين · {carb} غ كربوهيدرات", "أضف طعامًا واحدًا أو صورة على الأقل.", "تذكير بالوجبة التالية", "ذكّرني بعد {h} ساعة من هذه الوجبة", "سنذكّرك بالوجبة التالية بعد {h} ساعة.", "لم يُجدول التذكير (فات الوقت أو الإشعارات محظورة).",
"🍽️ حان وقت الوجبة التالية", "مرت {h} ساعة منذ آخر وجبة.", "مثل: أكلت قليلًا ثم غثيان", "تم الحفظ ✅", "حذف الوجبة", "حذف هذه الوجبة؟", "الوحدة", "قيمة غير صالحة. استخدم أرقامًا فقط (مثل 12.5).",
"أدخل من 1 إلى 365 يومًا.", "أدخل كمية بين 1 و5000 غ.", "أدخل وزنًا بين 20 و400 كغ.", "قياسات اليوم", "تسجيل", "وقت القياس", "ملاحظة (مثل: صائم، بعد الغداء)", "قيمة غير متوقعة. استخدم بين {min} و{max} {u}.",
"لا قياسات اليوم. اضغط تسجيل.", "ملاحظات اليوم", "كيف تشعر اليوم؟", "لا ملاحظات اليوم.", "إصدار التطبيق", "آخر تحديث", "الإصدار المثبت", "التحقق من التحديثات", "جارٍ التحقق...",
"جارٍ تنزيل التحديث...", "Leviã محدّث ✅", "تم تنزيل التحديث! اضغط أدناه لتطبيقه.", "تطبيق وإعادة تشغيل التطبيق", "تعذر التحقق الآن. تحقق من الاتصال وحاول مجددًا."]

# Ajustes nos idiomas-base: campos que agora são escolhidos por botões
BASE = {
    'med.primeiraDose': {'pt-BR': 'Horário da 1ª dose', 'pt-PT': 'Hora da 1.ª dose', 'es': 'Hora de la 1.ª dosis', 'en-US': 'Time of first dose'},
    'med.inicioData': {'pt-BR': 'Início do tratamento', 'es': 'Inicio del tratamiento', 'en-US': 'Treatment start'},
    'med.inicioHora': {'pt-BR': 'Horário da 1ª dose', 'pt-PT': 'Hora da 1.ª dose', 'es': 'Hora de la 1.ª dosis', 'en-US': 'Time of first dose'},
    'ref.horario': {'pt-BR': 'Horário', 'pt-PT': 'Hora', 'es': 'Hora', 'en-US': 'Time'},
}

saida = {}
for lang, vals in T.items():
    assert len(vals) == len(K), (lang, len(vals), len(K))
    for k, v in zip(K, vals):
        saida.setdefault(k, {})[lang] = v
for k, por in BASE.items():
    saida.setdefault(k, {}).update(por)
# o script de aplicação precisa de pt-BR para cair em reserva; usa o valor atual se não houver
caminho = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'traducoes_v031.json')
io.open(caminho, 'w', encoding='utf-8').write(json.dumps(saida, ensure_ascii=False, indent=1))
print(len(saida), 'chaves ·', len(T), 'idiomas')

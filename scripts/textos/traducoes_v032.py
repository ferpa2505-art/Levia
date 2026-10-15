"""
Textos da v0.3.2 (senha, biometria, e-mail obrigatório e relatórios por e-mail) nos 20 idiomas.
Uso: python scripts/textos/traducoes_v032.py && python scripts/adicionar_textos.py scripts/textos/traducoes_v032.json
{p} = "semanal"/"mensal" em minúsculas (adjetivo); demais marcadores como no código.
"""
import io, json, os

K = """rel.assunto rel.canal rel.corpoEmail rel.mensal rel.notifCorpo rel.notifTitulo rel.semanal seg.aguarde seg.bioSub
seg.bioTitulo seg.biometriaPrompt seg.bloquearApos seg.concluir seg.confirmarSub seg.confirmarTitulo seg.confirmeIdentidade
seg.criarSub seg.criarTitulo seg.desbloquearSub seg.desbloquearTitulo seg.digital seg.digitalRosto seg.emailInvalido
seg.emailPrivacidade seg.emailRotulo seg.emailSub seg.emailTitulo seg.entrar seg.enviarAgora seg.esqueci seg.esqueciBio
seg.esqueciSemBio seg.esqueciTitulo seg.imediatamente seg.minutos seg.naoConfere seg.novaSenhaTitulo seg.olaNome
seg.protegido seg.recomecar seg.relComoFunciona seg.relMensal seg.relSemanal seg.rosto seg.segundos seg.senhaAtual
seg.titulo seg.trocarSenha seg.usarBio seg.usarSenha""".split()

T = {}
T['pt-BR'] = ["Leviã – relatório {p}", "Relatórios", "Olá! Segue em anexo o meu relatório {p} do Leviã, com peso, glicemia, medicações, GLP-1 e alimentação.", "mensal", "Toque para gerar o PDF e enviar para o seu e-mail.", "📄 Seu relatório {p} está pronto", "semanal", "Muitas tentativas. Aguarde {s} s para tentar de novo.", "Assim você entra no Leviã sem digitar a senha. Dá para mudar depois na aba Saúde.",
"Usar {b} para entrar?", "Desbloquear o Leviã", "Pedir a senha depois de sair do app", "Concluir", "Digite a mesma senha mais uma vez.", "Confirme sua senha", "Confirme que é você",
"Escolha de {min} a {max} números. Ela protege seus dados de saúde.", "Crie sua senha", "Digite sua senha para continuar.", "Bem-vindo(a) de volta", "a digital", "a digital ou o rosto", "Confira o e-mail (ex.: nome@gmail.com).",
"Seu e-mail fica guardado só neste celular. O Leviã não envia nada sem você confirmar.", "E-mail para os relatórios", "Ele será usado para você receber seus relatórios semanais e mensais em PDF.", "Qual é o seu e-mail?", "Entrar", "Enviar relatório semanal agora", "Esqueci minha senha", "Confirme sua identidade com a biometria do celular para criar uma nova senha.",
"Sem a senha e sem biometria não é possível abrir os dados. Se você tem um backup, desinstale e instale o Leviã de novo e use \"Restaurar backup\" na aba Saúde.", "Esqueceu a senha?", "Imediatamente", "{n} min", "As senhas não conferem. Tente de novo.", "Crie uma nova senha", "Olá, {nome}!",
"Seus dados ficam protegidos neste celular", "Começar de novo", "Toda segunda (semanal) e todo dia 1º (mensal), às 9h, o Leviã avisa que o relatório está pronto e abre o seu e-mail com o PDF anexado. É só tocar em Enviar.", "Relatório mensal por e-mail", "Relatório semanal por e-mail", "o rosto", "{n} s", "Digite sua senha atual",
"Segurança e relatórios", "Trocar senha", "Entrar com {b}", "Usar senha"]

T['pt-PT'] = ["Leviã – relatório {p}", "Relatórios", "Olá! Envio em anexo o meu relatório {p} do Leviã, com peso, glicemia, medicação, GLP-1 e alimentação.", "mensal", "Toque para gerar o PDF e enviar para o seu e-mail.", "📄 O seu relatório {p} está pronto", "semanal", "Demasiadas tentativas. Aguarde {s} s para tentar de novo.", "Assim entra no Leviã sem introduzir o código. Pode mudar depois no separador Saúde.",
"Usar {b} para entrar?", "Desbloquear o Leviã", "Pedir o código depois de sair da app", "Concluir", "Introduza o mesmo código mais uma vez.", "Confirme o seu código", "Confirme que é você",
"Escolha de {min} a {max} números. Ele protege os seus dados de saúde.", "Crie o seu código", "Introduza o seu código para continuar.", "Bem-vindo(a) de volta", "a impressão digital", "a impressão digital ou o rosto", "Verifique o e-mail (ex.: nome@gmail.com).",
"O seu e-mail fica guardado só neste telemóvel. O Leviã não envia nada sem a sua confirmação.", "E-mail para os relatórios", "Será usado para receber os seus relatórios semanais e mensais em PDF.", "Qual é o seu e-mail?", "Entrar", "Enviar relatório semanal agora", "Esqueci o meu código", "Confirme a sua identidade com a biometria do telemóvel para criar um novo código.",
"Sem o código e sem biometria não é possível abrir os dados. Se tiver um backup, desinstale e volte a instalar o Leviã e use \"Restaurar backup\" no separador Saúde.", "Esqueceu o código?", "Imediatamente", "{n} min", "Os códigos não coincidem. Tente de novo.", "Crie um novo código", "Olá, {nome}!",
"Os seus dados estão protegidos neste telemóvel", "Recomeçar", "Todas as segundas (semanal) e no dia 1 (mensal), às 9h, o Leviã avisa que o relatório está pronto e abre o e-mail com o PDF anexado. Basta tocar em Enviar.", "Relatório mensal por e-mail", "Relatório semanal por e-mail", "o rosto", "{n} s", "Introduza o código atual",
"Segurança e relatórios", "Mudar código", "Entrar com {b}", "Usar código"]

T['es'] = ["Leviã – informe {p}", "Informes", "¡Hola! Adjunto mi informe {p} de Leviã con peso, glucemia, medicamentos, GLP-1 y alimentación.", "mensual", "Toca para generar el PDF y enviarlo a tu correo.", "📄 Tu informe {p} está listo", "semanal", "Demasiados intentos. Espera {s} s para volver a intentarlo.", "Así entras en Leviã sin escribir el código. Puedes cambiarlo luego en la pestaña Salud.",
"¿Usar {b} para entrar?", "Desbloquear Leviã", "Pedir el código al salir de la app", "Terminar", "Escribe el mismo código otra vez.", "Confirma tu código", "Confirma que eres tú",
"Elige de {min} a {max} números. Protege tus datos de salud.", "Crea tu código", "Escribe tu código para continuar.", "Bienvenido(a) de nuevo", "la huella", "la huella o el rostro", "Revisa el correo (ej.: nombre@gmail.com).",
"Tu correo se guarda solo en este móvil. Leviã no envía nada sin tu confirmación.", "Correo para los informes", "Se usará para que recibas tus informes semanales y mensuales en PDF.", "¿Cuál es tu correo?", "Entrar", "Enviar informe semanal ahora", "Olvidé mi código", "Confirma tu identidad con la biometría del móvil para crear un código nuevo.",
"Sin el código y sin biometría no se pueden abrir los datos. Si tienes una copia de seguridad, desinstala y vuelve a instalar Leviã y usa \"Restaurar copia\" en la pestaña Salud.", "¿Olvidaste el código?", "Inmediatamente", "{n} min", "Los códigos no coinciden. Inténtalo de nuevo.", "Crea un código nuevo", "¡Hola, {nome}!",
"Tus datos están protegidos en este móvil", "Empezar de nuevo", "Cada lunes (semanal) y cada día 1 (mensual), a las 9 h, Leviã avisa que el informe está listo y abre tu correo con el PDF adjunto. Solo toca Enviar.", "Informe mensual por correo", "Informe semanal por correo", "el rostro", "{n} s", "Escribe tu código actual",
"Seguridad e informes", "Cambiar código", "Entrar con {b}", "Usar código"]

T['en-US'] = ["Leviã – {p} report", "Reports", "Hi! Attached is my {p} Leviã report with weight, glucose, medications, GLP-1 and food.", "monthly", "Tap to create the PDF and send it to your email.", "📄 Your {p} report is ready", "weekly", "Too many attempts. Wait {s} s to try again.", "This way you open Leviã without typing your PIN. You can change it later in the Health tab.",
"Use {b} to unlock?", "Unlock Leviã", "Ask for the PIN after leaving the app", "Done", "Enter the same PIN once more.", "Confirm your PIN", "Confirm it's you",
"Choose {min} to {max} digits. It protects your health data.", "Create your PIN", "Enter your PIN to continue.", "Welcome back", "your fingerprint", "your fingerprint or face", "Check the email (e.g. name@gmail.com).",
"Your email is stored only on this phone. Leviã never sends anything without your confirmation.", "Email for reports", "We'll use it so you can receive your weekly and monthly PDF reports.", "What's your email?", "Unlock", "Send weekly report now", "I forgot my PIN", "Confirm your identity with your phone's biometrics to create a new PIN.",
"Without the PIN and biometrics, the data can't be opened. If you have a backup, uninstall and reinstall Leviã and use \"Restore backup\" in the Health tab.", "Forgot your PIN?", "Immediately", "{n} min", "PINs don't match. Try again.", "Create a new PIN", "Hi, {nome}!",
"Your data is protected on this phone", "Start over", "Every Monday (weekly) and on the 1st (monthly), at 9 a.m., Leviã lets you know the report is ready and opens your email with the PDF attached. Just tap Send.", "Monthly report by email", "Weekly report by email", "your face", "{n} s", "Enter your current PIN",
"Security and reports", "Change PIN", "Unlock with {b}", "Use PIN"]

T['it'] = ["Leviã – report {p}", "Report", "Ciao! In allegato il mio report {p} di Leviã con peso, glicemia, farmaci, GLP-1 e alimentazione.", "mensile", "Tocca per creare il PDF e inviarlo alla tua e-mail.", "📄 Il tuo report {p} è pronto", "settimanale", "Troppi tentativi. Attendi {s} s per riprovare.", "Così apri Leviã senza digitare il PIN. Puoi cambiarlo più tardi nella scheda Salute.",
"Usare {b} per sbloccare?", "Sblocca Leviã", "Chiedi il PIN dopo essere uscito dall'app", "Fine", "Inserisci di nuovo lo stesso PIN.", "Conferma il PIN", "Conferma che sei tu",
"Scegli da {min} a {max} cifre. Protegge i tuoi dati di salute.", "Crea il tuo PIN", "Inserisci il PIN per continuare.", "Bentornato/a", "l'impronta", "l'impronta o il volto", "Controlla l'e-mail (es.: nome@gmail.com).",
"La tua e-mail resta solo su questo telefono. Leviã non invia nulla senza la tua conferma.", "E-mail per i report", "Servirà per ricevere i tuoi report settimanali e mensili in PDF.", "Qual è la tua e-mail?", "Sblocca", "Invia ora il report settimanale", "Ho dimenticato il PIN", "Conferma la tua identità con la biometria del telefono per creare un nuovo PIN.",
"Senza PIN e senza biometria non è possibile aprire i dati. Se hai un backup, disinstalla e reinstalla Leviã e usa \"Ripristina backup\" nella scheda Salute.", "PIN dimenticato?", "Subito", "{n} min", "I PIN non coincidono. Riprova.", "Crea un nuovo PIN", "Ciao, {nome}!",
"I tuoi dati sono protetti su questo telefono", "Ricomincia", "Ogni lunedì (settimanale) e il giorno 1 (mensile), alle 9, Leviã ti avvisa che il report è pronto e apre l'e-mail con il PDF allegato. Basta toccare Invia.", "Report mensile via e-mail", "Report settimanale via e-mail", "il volto", "{n} s", "Inserisci il PIN attuale",
"Sicurezza e report", "Cambia PIN", "Sblocca con {b}", "Usa il PIN"]

T['fr'] = ["Leviã – rapport {p}", "Rapports", "Bonjour ! Voici en pièce jointe mon rapport {p} Leviã : poids, glycémie, médicaments, GLP-1 et alimentation.", "mensuel", "Touchez pour créer le PDF et l'envoyer à votre e-mail.", "📄 Votre rapport {p} est prêt", "hebdomadaire", "Trop de tentatives. Patientez {s} s.", "Vous ouvrez ainsi Leviã sans saisir le code. Modifiable ensuite dans l'onglet Santé.",
"Utiliser {b} pour déverrouiller ?", "Déverrouiller Leviã", "Demander le code après avoir quitté l'app", "Terminer", "Saisissez le même code une fois encore.", "Confirmez votre code", "Confirmez que c'est vous",
"Choisissez de {min} à {max} chiffres. Il protège vos données de santé.", "Créez votre code", "Saisissez votre code pour continuer.", "Bon retour", "l'empreinte", "l'empreinte ou le visage", "Vérifiez l'e-mail (ex. : nom@gmail.com).",
"Votre e-mail reste uniquement sur ce téléphone. Leviã n'envoie rien sans votre confirmation.", "E-mail pour les rapports", "Il servira à recevoir vos rapports hebdomadaires et mensuels en PDF.", "Quel est votre e-mail ?", "Déverrouiller", "Envoyer le rapport hebdomadaire", "Code oublié", "Confirmez votre identité avec la biométrie du téléphone pour créer un nouveau code.",
"Sans le code ni la biométrie, les données ne peuvent pas être ouvertes. Si vous avez une sauvegarde, désinstallez puis réinstallez Leviã et utilisez « Restaurer une sauvegarde » dans l'onglet Santé.", "Code oublié ?", "Immédiatement", "{n} min", "Les codes ne correspondent pas. Réessayez.", "Créez un nouveau code", "Bonjour, {nome} !",
"Vos données sont protégées sur ce téléphone", "Recommencer", "Chaque lundi (hebdomadaire) et le 1er du mois (mensuel), à 9 h, Leviã vous prévient que le rapport est prêt et ouvre votre e-mail avec le PDF joint. Il suffit de toucher Envoyer.", "Rapport mensuel par e-mail", "Rapport hebdomadaire par e-mail", "le visage", "{n} s", "Saisissez votre code actuel",
"Sécurité et rapports", "Changer le code", "Déverrouiller avec {b}", "Utiliser le code"]

T['de'] = ["Leviã – {p} Bericht", "Berichte", "Hallo! Anbei mein {p} Leviã-Bericht mit Gewicht, Blutzucker, Medikamenten, GLP-1 und Ernährung.", "monatlicher", "Tippe, um das PDF zu erstellen und an deine E-Mail zu senden.", "📄 Dein {p} Bericht ist fertig", "wöchentlicher", "Zu viele Versuche. Warte {s} s.", "So öffnest du Leviã ohne PIN. Du kannst das später im Tab Gesundheit ändern.",
"{b} zum Entsperren nutzen?", "Leviã entsperren", "PIN nach Verlassen der App verlangen", "Fertig", "Gib dieselbe PIN noch einmal ein.", "PIN bestätigen", "Bestätige, dass du es bist",
"Wähle {min} bis {max} Ziffern. Sie schützt deine Gesundheitsdaten.", "PIN erstellen", "Gib deine PIN ein, um fortzufahren.", "Willkommen zurück", "den Fingerabdruck", "Fingerabdruck oder Gesicht", "Prüfe die E-Mail (z. B. name@gmail.com).",
"Deine E-Mail wird nur auf diesem Handy gespeichert. Leviã sendet nichts ohne deine Bestätigung.", "E-Mail für Berichte", "Damit erhältst du deine wöchentlichen und monatlichen PDF-Berichte.", "Wie lautet deine E-Mail?", "Entsperren", "Wochenbericht jetzt senden", "PIN vergessen", "Bestätige deine Identität per Biometrie, um eine neue PIN zu erstellen.",
"Ohne PIN und Biometrie lassen sich die Daten nicht öffnen. Wenn du ein Backup hast, installiere Leviã neu und nutze „Backup wiederherstellen“ im Tab Gesundheit.", "PIN vergessen?", "Sofort", "{n} Min.", "Die PINs stimmen nicht überein. Versuch es erneut.", "Neue PIN erstellen", "Hallo, {nome}!",
"Deine Daten sind auf diesem Handy geschützt", "Neu beginnen", "Jeden Montag (wöchentlich) und am 1. des Monats (monatlich) um 9 Uhr meldet Leviã, dass der Bericht fertig ist, und öffnet deine E-Mail mit dem PDF im Anhang. Einfach auf Senden tippen.", "Monatsbericht per E-Mail", "Wochenbericht per E-Mail", "das Gesicht", "{n} s", "Aktuelle PIN eingeben",
"Sicherheit und Berichte", "PIN ändern", "Mit {b} entsperren", "PIN verwenden"]

T['nl'] = ["Leviã – {p} rapport", "Rapporten", "Hoi! In de bijlage mijn {p} Leviã-rapport met gewicht, glucose, medicatie, GLP-1 en voeding.", "maandelijks", "Tik om de pdf te maken en naar je e-mail te sturen.", "📄 Je {p} rapport staat klaar", "wekelijks", "Te veel pogingen. Wacht {s} s.", "Zo open je Leviã zonder pincode. Je kunt dit later wijzigen in het tabblad Gezondheid.",
"{b} gebruiken om te ontgrendelen?", "Leviã ontgrendelen", "Pincode vragen na het verlaten van de app", "Klaar", "Voer dezelfde pincode nog een keer in.", "Bevestig je pincode", "Bevestig dat jij het bent",
"Kies {min} tot {max} cijfers. Die beschermt je gezondheidsgegevens.", "Maak je pincode", "Voer je pincode in om verder te gaan.", "Welkom terug", "je vingerafdruk", "je vingerafdruk of gezicht", "Controleer het e-mailadres (bv. naam@gmail.com).",
"Je e-mailadres wordt alleen op deze telefoon bewaard. Leviã verstuurt niets zonder jouw bevestiging.", "E-mail voor rapporten", "Hiermee ontvang je je wekelijkse en maandelijkse pdf-rapporten.", "Wat is je e-mailadres?", "Ontgrendelen", "Weekrapport nu versturen", "Pincode vergeten", "Bevestig je identiteit met biometrie om een nieuwe pincode te maken.",
"Zonder pincode en biometrie kunnen de gegevens niet worden geopend. Heb je een back-up, installeer Leviã dan opnieuw en gebruik ‘Back-up terugzetten’ in het tabblad Gezondheid.", "Pincode vergeten?", "Direct", "{n} min", "De pincodes komen niet overeen. Probeer opnieuw.", "Maak een nieuwe pincode", "Hoi {nome}!",
"Je gegevens zijn beschermd op deze telefoon", "Opnieuw beginnen", "Elke maandag (wekelijks) en op de 1e (maandelijks) om 9.00 uur laat Leviã weten dat het rapport klaarstaat en opent je e-mail met de pdf als bijlage. Tik alleen op Verzenden.", "Maandrapport per e-mail", "Weekrapport per e-mail", "je gezicht", "{n} s", "Voer je huidige pincode in",
"Beveiliging en rapporten", "Pincode wijzigen", "Ontgrendelen met {b}", "Pincode gebruiken"]

T['pl'] = ["Leviã – raport {p}", "Raporty", "Cześć! W załączniku mój raport {p} z Leviã: waga, glukoza, leki, GLP-1 i jedzenie.", "miesięczny", "Dotknij, aby utworzyć PDF i wysłać na swój e-mail.", "📄 Twój raport {p} jest gotowy", "tygodniowy", "Za dużo prób. Poczekaj {s} s.", "Dzięki temu otworzysz Leviã bez wpisywania PIN-u. Możesz to zmienić w karcie Zdrowie.",
"Używać {b} do odblokowania?", "Odblokuj Leviã", "Pytaj o PIN po wyjściu z aplikacji", "Gotowe", "Wpisz ten sam PIN jeszcze raz.", "Potwierdź PIN", "Potwierdź, że to Ty",
"Wybierz od {min} do {max} cyfr. Chroni on Twoje dane zdrowotne.", "Utwórz PIN", "Wpisz PIN, aby kontynuować.", "Witaj ponownie", "odcisku palca", "odcisku palca lub twarzy", "Sprawdź e-mail (np. imie@gmail.com).",
"Twój e-mail jest zapisany tylko w tym telefonie. Leviã nie wysyła niczego bez Twojego potwierdzenia.", "E-mail do raportów", "Posłuży do otrzymywania tygodniowych i miesięcznych raportów PDF.", "Jaki jest Twój e-mail?", "Odblokuj", "Wyślij teraz raport tygodniowy", "Nie pamiętam PIN-u", "Potwierdź tożsamość biometrią telefonu, aby utworzyć nowy PIN.",
"Bez PIN-u i biometrii nie da się otworzyć danych. Jeśli masz kopię zapasową, odinstaluj i zainstaluj ponownie Leviã, a potem użyj „Przywróć kopię” w karcie Zdrowie.", "Nie pamiętasz PIN-u?", "Od razu", "{n} min", "PIN-y się różnią. Spróbuj ponownie.", "Utwórz nowy PIN", "Cześć, {nome}!",
"Twoje dane są chronione w tym telefonie", "Zacznij od nowa", "W każdy poniedziałek (tygodniowy) i 1. dnia miesiąca (miesięczny) o 9:00 Leviã powiadomi, że raport jest gotowy, i otworzy e-mail z załączonym PDF. Wystarczy dotknąć Wyślij.", "Raport miesięczny e-mailem", "Raport tygodniowy e-mailem", "twarzy", "{n} s", "Wpisz obecny PIN",
"Bezpieczeństwo i raporty", "Zmień PIN", "Odblokuj za pomocą {b}", "Użyj PIN-u"]

T['tr'] = ["Leviã – {p} rapor", "Raporlar", "Merhaba! Kilo, kan şekeri, ilaçlar, GLP-1 ve beslenme verilerimi içeren {p} Leviã raporum ektedir.", "aylık", "PDF'i oluşturup e-postana göndermek için dokun.", "📄 {p} raporun hazır", "haftalık", "Çok fazla deneme. Tekrar denemek için {s} sn bekle.", "Böylece Leviã'yı şifre yazmadan açarsın. Daha sonra Sağlık sekmesinden değiştirebilirsin.",
"Kilidi {b} ile açmak ister misin?", "Leviã'nın kilidini aç", "Uygulamadan çıkınca şifre iste", "Bitir", "Aynı şifreyi bir kez daha gir.", "Şifreni onayla", "Sen olduğunu doğrula",
"{min}–{max} rakam seç. Sağlık verilerini korur.", "Şifreni oluştur", "Devam etmek için şifreni gir.", "Tekrar hoş geldin", "parmak izi", "parmak izi veya yüz", "E-postayı kontrol et (ör. ad@gmail.com).",
"E-postan yalnızca bu telefonda saklanır. Leviã senin onayın olmadan hiçbir şey göndermez.", "Raporlar için e-posta", "Haftalık ve aylık PDF raporlarını alman için kullanılacak.", "E-postan nedir?", "Kilidi aç", "Haftalık raporu şimdi gönder", "Şifremi unuttum", "Yeni şifre oluşturmak için telefonun biyometrisiyle kimliğini doğrula.",
"Şifre ve biyometri olmadan veriler açılamaz. Yedeğin varsa Leviã'yı kaldırıp yeniden yükle ve Sağlık sekmesinde \"Yedeği geri yükle\"yi kullan.", "Şifreni mi unuttun?", "Hemen", "{n} dk", "Şifreler eşleşmiyor. Tekrar dene.", "Yeni bir şifre oluştur", "Merhaba {nome}!",
"Verilerin bu telefonda korunuyor", "Baştan başla", "Her pazartesi (haftalık) ve her ayın 1'inde (aylık) saat 09:00'da Leviã raporun hazır olduğunu bildirir ve PDF ekli olarak e-postanı açar. Sadece Gönder'e dokun.", "E-postayla aylık rapor", "E-postayla haftalık rapor", "yüz", "{n} sn", "Mevcut şifreni gir",
"Güvenlik ve raporlar", "Şifreyi değiştir", "{b} ile aç", "Şifre kullan"]

T['ru'] = ["Leviã — {p} отчёт", "Отчёты", "Здравствуйте! Во вложении мой {p} отчёт Leviã: вес, глюкоза, лекарства, GLP-1 и питание.", "ежемесячный", "Нажмите, чтобы создать PDF и отправить на вашу почту.", "📄 Ваш {p} отчёт готов", "еженедельный", "Слишком много попыток. Подождите {s} с.", "Так вы будете входить в Leviã без кода. Это можно изменить во вкладке «Здоровье».",
"Использовать {b} для входа?", "Разблокировать Leviã", "Запрашивать код после выхода из приложения", "Готово", "Введите тот же код ещё раз.", "Подтвердите код", "Подтвердите, что это вы",
"Выберите от {min} до {max} цифр. Код защищает ваши данные о здоровье.", "Создайте код", "Введите код, чтобы продолжить.", "С возвращением", "отпечаток пальца", "отпечаток или лицо", "Проверьте e-mail (напр.: name@gmail.com).",
"Ваш e-mail хранится только на этом телефоне. Leviã ничего не отправляет без вашего подтверждения.", "E-mail для отчётов", "На него вы будете получать еженедельные и ежемесячные отчёты в PDF.", "Ваш e-mail?", "Войти", "Отправить недельный отчёт сейчас", "Я забыл(а) код", "Подтвердите личность биометрией телефона, чтобы создать новый код.",
"Без кода и биометрии открыть данные нельзя. Если у вас есть резервная копия, переустановите Leviã и используйте «Восстановить копию» во вкладке «Здоровье».", "Забыли код?", "Сразу", "{n} мин", "Коды не совпадают. Попробуйте ещё раз.", "Создайте новый код", "Здравствуйте, {nome}!",
"Ваши данные защищены на этом телефоне", "Начать заново", "Каждый понедельник (еженедельно) и 1-го числа (ежемесячно) в 9:00 Leviã сообщит, что отчёт готов, и откроет почту с прикреплённым PDF. Останется нажать «Отправить».", "Ежемесячный отчёт на почту", "Еженедельный отчёт на почту", "лицо", "{n} с", "Введите текущий код",
"Безопасность и отчёты", "Сменить код", "Войти с помощью: {b}", "Ввести код"]

T['ja'] = ["Leviã – {p}レポート", "レポート", "こんにちは。体重・血糖値・お薬・GLP-1・食事をまとめたLeviãの{p}レポートを添付します。", "月次", "タップしてPDFを作成し、メールで送信します。", "📄 {p}レポートの準備ができました", "週次", "試行回数が多すぎます。{s}秒お待ちください。", "暗証番号を入力せずにLeviãを開けます。あとで「健康」タブで変更できます。",
"{b}でロックを解除しますか？", "Leviãのロックを解除", "アプリを離れた後に暗証番号を求める", "完了", "同じ暗証番号をもう一度入力してください。", "暗証番号の確認", "本人確認をしてください",
"{min}〜{max}桁の数字を選んでください。健康データを守ります。", "暗証番号を作成", "続けるには暗証番号を入力してください。", "おかえりなさい", "指紋", "指紋または顔", "メールアドレスを確認してください（例：name@gmail.com）。",
"メールアドレスはこの端末にのみ保存されます。確認なしにLeviãが何かを送ることはありません。", "レポート用メールアドレス", "週次・月次のPDFレポートを受け取るために使います。", "メールアドレスを教えてください", "ロック解除", "今すぐ週次レポートを送る", "暗証番号を忘れた", "端末の生体認証で本人確認すると、新しい暗証番号を作成できます。",
"暗証番号も生体認証も使えない場合、データは開けません。バックアップがあれば、Leviãを再インストールして「健康」タブの「バックアップを復元」を使ってください。", "暗証番号を忘れましたか？", "すぐに", "{n}分", "暗証番号が一致しません。もう一度お試しください。", "新しい暗証番号を作成", "こんにちは、{nome}さん！",
"データはこの端末で保護されています", "最初からやり直す", "毎週月曜（週次）と毎月1日（月次）の9時に、Leviãがレポートの準備ができたことを知らせ、PDFを添付したメールを開きます。送信をタップするだけです。", "月次レポートをメールで", "週次レポートをメールで", "顔", "{n}秒", "現在の暗証番号を入力",
"セキュリティとレポート", "暗証番号を変更", "{b}で解除", "暗証番号を使う"]

T['ko'] = ["Leviã – {p} 리포트", "리포트", "안녕하세요! 체중, 혈당, 약, GLP-1, 식사가 담긴 Leviã {p} 리포트를 첨부합니다.", "월간", "눌러서 PDF를 만들고 이메일로 보내세요.", "📄 {p} 리포트가 준비됐어요", "주간", "시도 횟수가 너무 많아요. {s}초 후 다시 시도하세요.", "비밀번호 없이 Leviã를 열 수 있어요. 나중에 건강 탭에서 바꿀 수 있어요.",
"{b}(으)로 잠금을 해제할까요?", "Leviã 잠금 해제", "앱을 나간 뒤 비밀번호 요청", "완료", "같은 비밀번호를 한 번 더 입력하세요.", "비밀번호 확인", "본인인지 확인하세요",
"{min}~{max}자리 숫자를 고르세요. 건강 데이터를 보호해요.", "비밀번호 만들기", "계속하려면 비밀번호를 입력하세요.", "다시 오신 걸 환영해요", "지문", "지문 또는 얼굴", "이메일을 확인하세요 (예: name@gmail.com).",
"이메일은 이 휴대폰에만 저장돼요. 확인 없이 Leviã가 무엇도 보내지 않아요.", "리포트용 이메일", "주간·월간 PDF 리포트를 받는 데 사용돼요.", "이메일 주소가 무엇인가요?", "잠금 해제", "지금 주간 리포트 보내기", "비밀번호를 잊었어요", "휴대폰 생체 인증으로 본인 확인 후 새 비밀번호를 만드세요.",
"비밀번호와 생체 인증 없이는 데이터를 열 수 없어요. 백업이 있다면 Leviã를 다시 설치하고 건강 탭의 '백업 복원'을 사용하세요.", "비밀번호를 잊으셨나요?", "즉시", "{n}분", "비밀번호가 일치하지 않아요. 다시 시도하세요.", "새 비밀번호 만들기", "안녕하세요, {nome}님!",
"데이터가 이 휴대폰에서 보호되고 있어요", "처음부터 다시", "매주 월요일(주간)과 매월 1일(월간) 오전 9시에 리포트가 준비됐다고 알리고, PDF가 첨부된 이메일을 열어 드려요. 보내기만 누르면 돼요.", "이메일로 월간 리포트", "이메일로 주간 리포트", "얼굴", "{n}초", "현재 비밀번호를 입력하세요",
"보안 및 리포트", "비밀번호 변경", "{b}(으)로 해제", "비밀번호 사용"]

T['zh-CN'] = ["Leviã – {p}报告", "报告", "你好！附件是我的 Leviã {p}报告，包括体重、血糖、药物、GLP-1 和饮食。", "月度", "点击生成 PDF 并发送到你的邮箱。", "📄 你的{p}报告已准备好", "每周", "尝试次数过多，请等待 {s} 秒后再试。", "这样打开 Leviã 时无需输入密码。之后可在“健康”标签中更改。",
"使用{b}解锁？", "解锁 Leviã", "离开应用后要求输入密码", "完成", "请再次输入相同的密码。", "确认密码", "请确认是你本人",
"请设置 {min} 到 {max} 位数字，用于保护你的健康数据。", "设置密码", "输入密码以继续。", "欢迎回来", "指纹", "指纹或面部", "请检查邮箱（例如 name@gmail.com）。",
"你的邮箱只保存在这台手机上。未经你确认，Leviã 不会发送任何内容。", "接收报告的邮箱", "用于接收每周和每月的 PDF 报告。", "你的邮箱是？", "解锁", "立即发送本周报告", "忘记密码", "使用手机生物识别确认身份后即可设置新密码。",
"没有密码和生物识别将无法打开数据。如有备份，请重新安装 Leviã，并在“健康”标签中使用“恢复备份”。", "忘记密码？", "立即", "{n} 分钟", "两次密码不一致，请重试。", "设置新密码", "你好，{nome}！",
"你的数据在这台手机上受到保护", "重新开始", "每周一（每周）和每月 1 日（每月）上午 9 点，Leviã 会提醒报告已准备好，并打开已附上 PDF 的邮件。只需点击发送。", "通过邮件发送月度报告", "通过邮件发送每周报告", "面部", "{n} 秒", "输入当前密码",
"安全与报告", "更改密码", "使用{b}解锁", "使用密码"]

T['id'] = ["Leviã – laporan {p}", "Laporan", "Halo! Terlampir laporan {p} Leviã saya berisi berat badan, gula darah, obat, GLP-1, dan makanan.", "bulanan", "Ketuk untuk membuat PDF dan mengirim ke email kamu.", "📄 Laporan {p} kamu sudah siap", "mingguan", "Terlalu banyak percobaan. Tunggu {s} detik.", "Dengan ini kamu membuka Leviã tanpa mengetik PIN. Bisa diubah nanti di tab Kesehatan.",
"Gunakan {b} untuk membuka?", "Buka kunci Leviã", "Minta PIN setelah keluar dari aplikasi", "Selesai", "Masukkan PIN yang sama sekali lagi.", "Konfirmasi PIN", "Konfirmasi bahwa ini kamu",
"Pilih {min} sampai {max} angka. PIN melindungi data kesehatanmu.", "Buat PIN", "Masukkan PIN untuk melanjutkan.", "Selamat datang kembali", "sidik jari", "sidik jari atau wajah", "Periksa email (mis. nama@gmail.com).",
"Email kamu hanya disimpan di ponsel ini. Leviã tidak mengirim apa pun tanpa konfirmasimu.", "Email untuk laporan", "Digunakan untuk menerima laporan PDF mingguan dan bulanan.", "Apa email kamu?", "Buka kunci", "Kirim laporan mingguan sekarang", "Saya lupa PIN", "Konfirmasi identitas dengan biometrik ponsel untuk membuat PIN baru.",
"Tanpa PIN dan biometrik, data tidak bisa dibuka. Jika punya cadangan, instal ulang Leviã lalu gunakan \"Pulihkan cadangan\" di tab Kesehatan.", "Lupa PIN?", "Langsung", "{n} mnt", "PIN tidak cocok. Coba lagi.", "Buat PIN baru", "Halo, {nome}!",
"Datamu terlindungi di ponsel ini", "Mulai ulang", "Setiap Senin (mingguan) dan tanggal 1 (bulanan), pukul 09.00, Leviã memberi tahu laporan sudah siap dan membuka email dengan PDF terlampir. Tinggal ketuk Kirim.", "Laporan bulanan lewat email", "Laporan mingguan lewat email", "wajah", "{n} dtk", "Masukkan PIN saat ini",
"Keamanan dan laporan", "Ganti PIN", "Buka dengan {b}", "Gunakan PIN"]

T['vi'] = ["Leviã – báo cáo {p}", "Báo cáo", "Xin chào! Đính kèm báo cáo {p} Leviã của tôi gồm cân nặng, đường huyết, thuốc, GLP-1 và ăn uống.", "hằng tháng", "Chạm để tạo PDF và gửi tới email của bạn.", "📄 Báo cáo {p} của bạn đã sẵn sàng", "hằng tuần", "Thử quá nhiều lần. Chờ {s} giây.", "Như vậy bạn mở Leviã mà không cần nhập mã PIN. Có thể đổi sau trong thẻ Sức khỏe.",
"Dùng {b} để mở khóa?", "Mở khóa Leviã", "Hỏi mã PIN sau khi rời ứng dụng", "Xong", "Nhập lại cùng mã PIN.", "Xác nhận mã PIN", "Xác nhận đó là bạn",
"Chọn {min} đến {max} chữ số. Mã giúp bảo vệ dữ liệu sức khỏe.", "Tạo mã PIN", "Nhập mã PIN để tiếp tục.", "Chào mừng trở lại", "vân tay", "vân tay hoặc khuôn mặt", "Kiểm tra lại email (vd: ten@gmail.com).",
"Email chỉ được lưu trên điện thoại này. Leviã không gửi gì khi chưa có xác nhận của bạn.", "Email nhận báo cáo", "Dùng để nhận báo cáo PDF hằng tuần và hằng tháng.", "Email của bạn là gì?", "Mở khóa", "Gửi báo cáo tuần ngay", "Tôi quên mã PIN", "Xác nhận danh tính bằng sinh trắc học để tạo mã PIN mới.",
"Không có mã PIN và sinh trắc học thì không thể mở dữ liệu. Nếu có bản sao lưu, hãy cài lại Leviã và dùng \"Khôi phục bản sao lưu\" trong thẻ Sức khỏe.", "Quên mã PIN?", "Ngay lập tức", "{n} phút", "Mã PIN không khớp. Thử lại.", "Tạo mã PIN mới", "Chào {nome}!",
"Dữ liệu của bạn được bảo vệ trên điện thoại này", "Bắt đầu lại", "Mỗi thứ Hai (hằng tuần) và ngày 1 (hằng tháng) lúc 9 giờ, Leviã báo báo cáo đã sẵn sàng và mở email có đính kèm PDF. Chỉ cần chạm Gửi.", "Báo cáo tháng qua email", "Báo cáo tuần qua email", "khuôn mặt", "{n} giây", "Nhập mã PIN hiện tại",
"Bảo mật và báo cáo", "Đổi mã PIN", "Mở bằng {b}", "Dùng mã PIN"]

T['th'] = ["Leviã – รายงาน{p}", "รายงาน", "สวัสดี! แนบรายงาน{p}ของ Leviã ซึ่งมีน้ำหนัก น้ำตาล ยา GLP-1 และอาหาร", "รายเดือน", "แตะเพื่อสร้าง PDF และส่งไปยังอีเมลของคุณ", "📄 รายงาน{p}ของคุณพร้อมแล้ว", "รายสัปดาห์", "ลองหลายครั้งเกินไป รอ {s} วินาที", "คุณจะเปิด Leviã ได้โดยไม่ต้องพิมพ์รหัส เปลี่ยนได้ภายหลังในแท็บสุขภาพ",
"ใช้{b}เพื่อปลดล็อกไหม?", "ปลดล็อก Leviã", "ขอรหัสหลังออกจากแอป", "เสร็จสิ้น", "ป้อนรหัสเดิมอีกครั้ง", "ยืนยันรหัส", "ยืนยันว่าเป็นคุณ",
"เลือกตัวเลข {min} ถึง {max} หลัก ใช้ปกป้องข้อมูลสุขภาพของคุณ", "สร้างรหัส", "ป้อนรหัสเพื่อดำเนินการต่อ", "ยินดีต้อนรับกลับ", "ลายนิ้วมือ", "ลายนิ้วมือหรือใบหน้า", "ตรวจสอบอีเมล (เช่น name@gmail.com)",
"อีเมลของคุณถูกเก็บไว้ในโทรศัพท์นี้เท่านั้น Leviã จะไม่ส่งอะไรโดยไม่ได้รับการยืนยัน", "อีเมลสำหรับรายงาน", "ใช้รับรายงาน PDF รายสัปดาห์และรายเดือน", "อีเมลของคุณคืออะไร?", "ปลดล็อก", "ส่งรายงานรายสัปดาห์ตอนนี้", "ฉันลืมรหัส", "ยืนยันตัวตนด้วยไบโอเมตริกของโทรศัพท์เพื่อสร้างรหัสใหม่",
"หากไม่มีรหัสและไบโอเมตริกจะเปิดข้อมูลไม่ได้ หากมีข้อมูลสำรอง ให้ติดตั้ง Leviã ใหม่แล้วใช้ \"กู้คืนข้อมูลสำรอง\" ในแท็บสุขภาพ", "ลืมรหัสหรือไม่?", "ทันที", "{n} นาที", "รหัสไม่ตรงกัน ลองอีกครั้ง", "สร้างรหัสใหม่", "สวัสดี {nome}!",
"ข้อมูลของคุณได้รับการปกป้องในโทรศัพท์นี้", "เริ่มใหม่", "ทุกวันจันทร์ (รายสัปดาห์) และวันที่ 1 (รายเดือน) เวลา 9 โมง Leviã จะแจ้งว่ารายงานพร้อมแล้วและเปิดอีเมลที่แนบ PDF ไว้ แค่แตะส่ง", "รายงานรายเดือนทางอีเมล", "รายงานรายสัปดาห์ทางอีเมล", "ใบหน้า", "{n} วินาที", "ป้อนรหัสปัจจุบัน",
"ความปลอดภัยและรายงาน", "เปลี่ยนรหัส", "ปลดล็อกด้วย{b}", "ใช้รหัส"]

T['hi'] = ["Leviã – {p} रिपोर्ट", "रिपोर्ट", "नमस्ते! संलग्न है मेरी {p} Leviã रिपोर्ट — वज़न, ब्लड शुगर, दवाइयाँ, GLP-1 और भोजन।", "मासिक", "PDF बनाकर अपने ईमेल पर भेजने के लिए टैप करें।", "📄 आपकी {p} रिपोर्ट तैयार है", "साप्ताहिक", "बहुत ज़्यादा प्रयास। {s} सेकंड रुकें।", "इससे आप बिना पिन डाले Leviã खोल सकेंगे। बाद में स्वास्थ्य टैब में बदल सकते हैं।",
"अनलॉक के लिए {b} इस्तेमाल करें?", "Leviã अनलॉक करें", "ऐप से बाहर जाने के बाद पिन पूछें", "पूरा करें", "वही पिन एक बार फिर डालें।", "पिन की पुष्टि करें", "पुष्टि करें कि यह आप हैं",
"{min} से {max} अंक चुनें। यह आपके स्वास्थ्य डेटा की रक्षा करता है।", "अपना पिन बनाएँ", "जारी रखने के लिए पिन डालें।", "फिर से स्वागत है", "फ़िंगरप्रिंट", "फ़िंगरप्रिंट या चेहरा", "ईमेल जाँचें (जैसे: name@gmail.com)।",
"आपका ईमेल सिर्फ़ इसी फ़ोन में रहता है। आपकी पुष्टि के बिना Leviã कुछ नहीं भेजता।", "रिपोर्ट के लिए ईमेल", "इससे आपको साप्ताहिक और मासिक PDF रिपोर्ट मिलेंगी।", "आपका ईमेल क्या है?", "अनलॉक करें", "अभी साप्ताहिक रिपोर्ट भेजें", "मैं पिन भूल गया/गई", "नया पिन बनाने के लिए फ़ोन के बायोमेट्रिक से पहचान की पुष्टि करें।",
"पिन और बायोमेट्रिक के बिना डेटा नहीं खुल सकता। अगर बैकअप है, तो Leviã दोबारा इंस्टॉल करें और स्वास्थ्य टैब में \"बैकअप वापस लाएँ\" इस्तेमाल करें।", "पिन भूल गए?", "तुरंत", "{n} मिनट", "पिन मेल नहीं खाते। फिर कोशिश करें।", "नया पिन बनाएँ", "नमस्ते, {nome}!",
"आपका डेटा इस फ़ोन पर सुरक्षित है", "फिर से शुरू करें", "हर सोमवार (साप्ताहिक) और हर महीने की 1 तारीख (मासिक) को सुबह 9 बजे Leviã बताएगा कि रिपोर्ट तैयार है और PDF लगे ईमेल को खोल देगा। बस भेजें पर टैप करें।", "ईमेल से मासिक रिपोर्ट", "ईमेल से साप्ताहिक रिपोर्ट", "चेहरा", "{n} सेकंड", "मौजूदा पिन डालें",
"सुरक्षा और रिपोर्ट", "पिन बदलें", "{b} से अनलॉक करें", "पिन इस्तेमाल करें"]

T['ar'] = ["Leviã – تقرير {p}", "التقارير", "مرحبًا! مرفق تقريري {p} من Leviã ويشمل الوزن والسكر والأدوية وGLP-1 والتغذية.", "شهري", "اضغط لإنشاء ملف PDF وإرساله إلى بريدك.", "📄 تقريرك {p} جاهز", "أسبوعي", "محاولات كثيرة. انتظر {s} ثانية.", "هكذا تفتح Leviã دون كتابة الرمز. يمكنك التغيير لاحقًا من تبويب الصحة.",
"استخدام {b} لفتح القفل؟", "فتح قفل Leviã", "طلب الرمز بعد مغادرة التطبيق", "إنهاء", "أدخل الرمز نفسه مرة أخرى.", "تأكيد الرمز", "أكّد أنك أنت",
"اختر من {min} إلى {max} أرقام. يحمي بياناتك الصحية.", "أنشئ رمزك", "أدخل رمزك للمتابعة.", "مرحبًا بعودتك", "البصمة", "البصمة أو الوجه", "تحقق من البريد (مثل name@gmail.com).",
"يُحفظ بريدك على هذا الهاتف فقط. لا يرسل Leviã أي شيء دون تأكيدك.", "البريد الخاص بالتقارير", "سيُستخدم لتصلك تقارير PDF الأسبوعية والشهرية.", "ما بريدك الإلكتروني؟", "فتح القفل", "أرسل التقرير الأسبوعي الآن", "نسيت الرمز", "أكّد هويتك ببصمة الهاتف لإنشاء رمز جديد.",
"بدون الرمز أو البصمة لا يمكن فتح البيانات. إن كانت لديك نسخة احتياطية، أعد تثبيت Leviã واستخدم \"استعادة النسخة\" من تبويب الصحة.", "نسيت الرمز؟", "فورًا", "{n} دقيقة", "الرمزان غير متطابقين. حاول مرة أخرى.", "أنشئ رمزًا جديدًا", "مرحبًا، {nome}!",
"بياناتك محمية على هذا الهاتف", "البدء من جديد", "كل يوم اثنين (أسبوعي) وفي اليوم الأول من الشهر (شهري) الساعة 9 صباحًا، ينبهك Leviã بأن التقرير جاهز ويفتح بريدك مع ملف PDF مرفق. فقط اضغط إرسال.", "تقرير شهري بالبريد", "تقرير أسبوعي بالبريد", "الوجه", "{n} ث", "أدخل الرمز الحالي",
"الأمان والتقارير", "تغيير الرمز", "فتح القفل بـ{b}", "استخدام الرمز"]

saida = {}
for lang, vals in T.items():
    assert len(vals) == len(K), (lang, len(vals), len(K))
    for k, v in zip(K, vals):
        saida.setdefault(k, {})[lang] = v
caminho = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'traducoes_v032.json')
io.open(caminho, 'w', encoding='utf-8').write(json.dumps(saida, ensure_ascii=False, indent=1))
print(len(saida), 'chaves ·', len(T), 'idiomas')

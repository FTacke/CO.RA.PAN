document.addEventListener('DOMContentLoaded', function() {
  let currentAudioPlayer = new Audio();
  let currentWordElement = null;
  let currentSpeakerElement = null;
  let audioContext = null;
  let lastAudioTime = 0; // Speicher für die letzte Zeit des Audioplayers


  const urlParams = new URLSearchParams(window.location.search);
  const transcriptionFile = urlParams.get('transcription');
  const audioFile = urlParams.get('audio');
  const audioFileName = audioFile.split('/').pop(); // Extrahiere den Dateinamen aus der URL
  const fileNameWithoutExtension = audioFileName.replace('.mp3', ''); // Entferne das ".mp3" aus dem Dateinamen
  document.title = `CO.RA.PAN // ${fileNameWithoutExtension}`; // Setze den Titel mit dem bereinigten Dateinamen


  console.log('Transcription File:', transcriptionFile);
  console.log('Audio File:', audioFile);

  const fullAudioPlayer = document.getElementById('fullAudioPlayer');
  fullAudioPlayer.src = audioFile;
  const filenameElement = document.getElementById('filename');
  const wordCountElement = document.getElementById('wordCount');
  const audioLengthElement = document.getElementById('audioLength');
  const transcriptionContainer = document.getElementById('transcriptionContainer');

  audioContext = new (window.AudioContext || window.webkitAudioContext)();

  loadTranscription(transcriptionFile, audioFile, filenameElement, wordCountElement, audioLengthElement, transcriptionContainer, currentAudioPlayer, currentWordElement, currentSpeakerElement);

  function loadTranscription(transcriptionFile, audioFile, filenameElement, wordCountElement, audioLengthElement, transcriptionContainer, currentAudioPlayer, currentWordElement, currentSpeakerElement) {
    fetch(transcriptionFile)
      .then(response => response.json())
      .then(transcriptionData => {
        // Anzeige der Metadaten
        filenameElement.textContent = 'Audio: ' + transcriptionData.filename;

        // Zähle die Anzahl der Wörter im Transkriptionstext
        const wordCount = transcriptionData.segments.reduce((count, segment) => {
          return count + segment.words.length;
        }, 0);
        wordCountElement.textContent = 'Número de palabras: ' + formatNumber(wordCount);

        // Zeige die Länge des Audio-Files an
        const audio = new Audio();
        audio.src = audioFile;
        audio.addEventListener('loadedmetadata', function() {
          const audioDuration = audio.duration;
          audioLengthElement.textContent = 'Duración del audio: ' + formatTime(audioDuration);
        });

        const segments = transcriptionData.segments;

        const wordsData = [];

        segments.forEach(segment => {
          const speakerId = segment.speaker;
          const words = segment.words;

          const transcriptionElement = document.createElement('p');
          transcriptionElement.classList.add('transcription');

          const speakerInfo = transcriptionData.speakers.find(speaker => speaker.spkid === speakerId);
          const speakerName = speakerInfo ? speakerInfo.name : "Unbekannter Sprecher";

          const speakerStartTime = formatTime(words[0].start);
          const speakerEndTime = formatTime(words[words.length - 1].end);

          const speakerTimeElement = document.createElement('div');
          speakerTimeElement.textContent = `${speakerStartTime} - ${speakerEndTime}`;
          speakerTimeElement.classList.add('speaker-time');
          transcriptionElement.appendChild(speakerTimeElement);

          const speakerElement = document.createElement('span');
          speakerElement.textContent = speakerName;
          speakerElement.classList.add('speaker');
          transcriptionElement.appendChild(speakerElement);

          words.forEach(word => {
            const text = word.text;
            const start = parseFloat(word.start);
            const end = parseFloat(word.end);

            const wordElement = document.createElement('span');
            wordElement.textContent = text + ' ';
            wordElement.classList.add('word');
            wordElement.setAttribute('data-start', start);
            wordElement.setAttribute('data-end', end);

            wordsData.push({ element: wordElement, start, end });

            wordElement.addEventListener('click', function(event) {
              event.stopPropagation();
              console.log('Palabra clickeada:', this.textContent);
              const start = parseFloat(this.getAttribute('data-start'));
              const end = parseFloat(this.getAttribute('data-end'));
              const buffer = 2.5;

              if (currentAudioPlayer) {
                currentAudioPlayer.pause();
                currentAudioPlayer = null;
              }

         

              if (!fullAudioPlayer.paused) {
              lastAudioTime = currentAudioPlayer.currentTime; // Speichere die letzte Zeit des Audioplayers
              fullAudioPlayer.currentTime = lastAudioTime; // Setze die Wiedergabezeit des Full-Audioplayers auf die des Audioplayers
              fullAudioPlayer.play(); // Starte den Full-Audioplayer
              }

              currentAudioPlayer = new Audio();
              currentAudioPlayer.src = audioFile;
              currentAudioPlayer.currentTime = start - buffer;
              currentAudioPlayer.play();

              // Entferne die Markierung von allen Wörtern
              wordsData.forEach(wordData => {
                wordData.element.classList.remove('playing');
              });

              // Markiere das angeklickte Wort
              currentWordElement = this;
              currentWordElement.classList.add('playing');

              // Füge den "timeupdate"-Listener hinzu, um die Wörter während der Wiedergabe zu markieren
              currentAudioPlayer.addEventListener('timeupdate', function() {
                const currentTime = currentAudioPlayer.currentTime;

                // Entferne die Markierung von allen Wörtern
                wordsData.forEach(wordData => {
                  wordData.element.classList.remove('playing');
                });

                // Finde das Wort, das zur aktuellen Wiedergabezeit gehört, und markiere es
                const playingWord = wordsData.find(wordData => currentTime >= wordData.start && currentTime <= wordData.end);

                if (playingWord) {
                  playingWord.element.classList.add('playing');
                }

                if (currentTime >= end + buffer) {
                  currentAudioPlayer.pause();
                  currentWordElement.classList.remove('playing');
                }
              });

              if (currentSpeakerElement) {
                currentSpeakerElement.classList.remove('active');
              }
              currentSpeakerElement = this.parentElement.querySelector('.speaker');
              currentSpeakerElement.classList.add('active');
            });

            transcriptionElement.appendChild(wordElement);
          });

          speakerElement.addEventListener('click', function(event) {
            event.stopPropagation();
            const speakerWords = words.map(word => parseFloat(word.start));
            const start = Math.min(...speakerWords);
            const end = Math.max(...speakerWords) + 1;
            const buffer = 2.5;

            if (currentAudioPlayer) {
              currentAudioPlayer.pause();
              currentAudioPlayer = null;
            }

            currentAudioPlayer = new Audio();
            currentAudioPlayer.src = audioFile;
            currentAudioPlayer.currentTime = start - buffer;
            currentAudioPlayer.play();

            // Entferne die Markierung von allen Wörtern
            wordsData.forEach(wordData => {
              wordData.element.classList.remove('playing');
            });

            // Füge den "timeupdate"-Listener hinzu, um die Wörter während der Wiedergabe zu markieren
            currentAudioPlayer.addEventListener('timeupdate', function() {
              const currentTime = currentAudioPlayer.currentTime;

              // Entferne die Markierung von allen Wörtern
              wordsData.forEach(wordData => {
                wordData.element.classList.remove('playing');
              });

              // Finde das Wort, das zur aktuellen Wiedergabezeit gehört, und markiere es
              const playingWord = wordsData.find(wordData => currentTime >= wordData.start && currentTime <= wordData.end);

              if (playingWord) {
                playingWord.element.classList.add('playing');
              }

              if (currentTime >= end + buffer) {
                currentAudioPlayer.pause();
                if (currentWordElement) {
                  currentWordElement.classList.remove('playing');
                }
              }
            });

            if (currentSpeakerElement) {
              currentSpeakerElement.classList.remove('active');
            }
            currentSpeakerElement = this;
            currentSpeakerElement.classList.add('active');
          });

          transcriptionContainer.appendChild(transcriptionElement);
        });

        // Füge den "timeupdate"-Listener hinzu, um die Wörter während der Wiedergabe des "fullAudioPlayer" zu markieren
        fullAudioPlayer.addEventListener('timeupdate', function() {
          const currentTime = fullAudioPlayer.currentTime;

          // Entferne die Markierung von allen Wörtern
          wordsData.forEach(wordData => {
            wordData.element.classList.remove('playing');
          });

          // Finde das Wort, das zur aktuellen Wiedergabezeit gehört, und markiere es
          const playingWord = wordsData.find(wordData => currentTime >= wordData.start && currentTime <= wordData.end);

          if (playingWord) {
            playingWord.element.classList.add('playing');
          }
        });

      })
      .catch(error => console.error('Fehler beim Laden der Transkription:', error));
  }

  // Funktion zur Wiedergabe des Audios mit der Web Audio API
  function playAudioWithWebAudioAPI(audioBuffer, start, duration) {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    // Starte die Wiedergabe leicht vor dem Klickzeitpunkt
    source.start(0, start - 0.5, duration);

    // Verbinde die Quelle mit dem Ausgabekanal des AudioContexts
    source.connect(audioContext.destination);
  }

  function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function formatTime(timeInSeconds) {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.round(timeInSeconds % 60);
    return `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }
});

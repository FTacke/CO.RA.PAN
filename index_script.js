document.addEventListener('DOMContentLoaded', function() {
  const mp3LinksContainer = document.getElementById('mp3Links');
  const totalWordCountElement = document.getElementById('totalWordCount');
  const totalDurationElement = document.getElementById('totalDuration');
  const subfolder = 'logo/'; // Unterordner mit Slash am Ende

  let totalWordCount = 0;
  let totalDurationInSeconds = 0;

  // Hier generieren wir Links für alle .mp3-Dateien im Unterordner
  fetch(`${subfolder}`)
    .then(response => response.text())
    .then(text => {
      const parser = new DOMParser();
      const html = parser.parseFromString(text, 'text/html');
      const links = Array.from(html.querySelectorAll('a[href$=".mp3"]'));

      links.forEach(link => {
        const mp3File = link.getAttribute('href');
        const transcriptionFile = mp3File.replace('.mp3', '.json');
        const mp3FileName = mp3File.split('/').pop(); // Hier wird nur der Dateiname ohne Pfad extrahiert
        const mp3Link = document.createElement('a');
        mp3Link.href = "#";
        mp3Link.setAttribute('data-transcription', transcriptionFile);
        mp3Link.setAttribute('data-audio', mp3File); // Hier wird subfolder verwendet
        mp3Link.textContent = mp3FileName.replace('.mp3', ''); // Hier wird nur der Dateiname angezeigt

        mp3Link.addEventListener('click', function(event) {
          event.preventDefault();
          openPlayer(transcriptionFile, mp3File); // Hier wird subfolder verwendet
        });

        const listItem = document.createElement('li');
        listItem.appendChild(mp3Link);
        mp3LinksContainer.appendChild(listItem);

        // Statistiken aktualisieren
        fetch(transcriptionFile)
          .then(response => response.json())
          .then(transcriptionData => {
            totalWordCount += countTotalWords(transcriptionData.segments);
            totalDurationInSeconds += calculateTotalDuration(transcriptionData.segments);
            updateTotalStats(totalWordCount, totalDurationInSeconds);
          });
      });
    });

  function openPlayer(transcriptionFile, audioFile) {
    window.location.href = `player.html?transcription=${transcriptionFile}&audio=${audioFile}`;
  }

  function countTotalWords(segments) {
    return segments.reduce((count, segment) => count + segment.words.length, 0);
  }

  function calculateTotalDuration(segments) {
    return segments.reduce((totalDuration, segment) => {
      const segmentStart = parseFloat(segment.words[0].start);
      const segmentEnd = parseFloat(segment.words[segment.words.length - 1].end);
      return totalDuration + (segmentEnd - segmentStart);
    }, 0);
  }

  function formatTime(timeInSeconds) {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  function updateTotalStats(wordCount, durationInSeconds) {
    totalWordCountElement.textContent = `Número total de palabras: ${wordCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
    totalDurationElement.textContent = `Duración total de los audios: ${formatTime(durationInSeconds)}`;
  }
});

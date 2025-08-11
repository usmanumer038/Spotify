let currentSong = new Audio();
let currFolder;
let songs = [];

function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds
  ).padStart(2, '0')}`;
}

async function getsongs(folder) {
  currFolder = folder.endsWith('/') ? folder : folder + '/';
  let a = await fetch(`${folder}/`);
  let text = await a.text();
  let div = document.createElement('div');
  div.innerHTML = text;
  let as = div.getElementsByTagName('a');
  songs = [];

  for (let a of as) {
    if (a.href.endsWith('.mp3')) {
      let filename = decodeURIComponent(
        new URL(a.href).pathname.split('/').pop()
      );
      songs.push(filename);
    }
  }
  return songs;
}

function playMusic(track, pause = false) {
  currentSong.src = `${currFolder}${track}`;
  if (!pause) {
    currentSong.play();
    play.src = 'img/pause.svg';
  }
  document.querySelector('.songtime').innerHTML = '00:00 / 00:00';

  let cleanTrackName = track
    .replace(/(%40LYRICS%F0%9F%96%A4|\(256k\)|\(128k\)|\.mp3|%2C)/g, '')
    .replace(/[_\/]/g, ' ')
    .trim();

  document.querySelector('.songinfo').innerHTML = cleanTrackName;
}

function updateSongList(songArray) {
  let songUL = document.querySelector('.songList ul');
  songUL.innerHTML = '';

  for (const song of songArray) {
    let cleanName = song
      .replace(/(%40LYRICS%F0%9F%96%A4|\(256k\)|\(128k\)|\.mp3|%2C)/g, '')
      .replace(/[_\/]/g, ' ')
      .trim();

    songUL.innerHTML += `
      <li data-filename="${song}">
        <img class="invert" src="/img/music.svg" alt="music" width="20" height="20">
        <div class="info"><div style="font-weight: bold;">${cleanName}</div></div>
        <div class="playnow"><span>Play Now</span><img class="invert" src="/img/play2.svg" alt="play" width="20" height="20"></div>
      </li>`;
  }

  document.querySelectorAll('.songList li').forEach((li) => {
    li.addEventListener('click', () => {
      const filename = li.getAttribute('data-filename');
      playMusic(filename);
    });
  });
}
async function displayAlbums() {
  console.log('displaying albums');
  let a = await fetch(`/songs/`);
  let response = await a.text();
  let div = document.createElement('div');
  div.innerHTML = response;
  let anchors = div.getElementsByTagName('a');
  let cardContainer = document.querySelector('.cardContainer');
  let array = Array.from(anchors);
  for (let index = 0; index < array.length; index++) {
    const e = array[index];
    let parts = e.href.split('/');
    let songsIndex = parts.indexOf('songs');
    // Only process folders that are direct children of /songs/
    if (
      songsIndex !== -1 &&
      parts.length === songsIndex + 2 && // e.g. .../songs/albumname/
      !e.href.includes('.htaccess')
    ) {
      let folder = parts[songsIndex + 1];
      try {
        let a = await fetch(`/songs/${folder}/info.json`);
        if (!a.ok) throw new Error('info.json not found');
        let response = await a.json();
        cardContainer.innerHTML =
          cardContainer.innerHTML +
          ` <div data-folder="${folder}" class="card">
            <div class="play">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                        stroke-linejoin="round" />
                </svg>
            </div>
            <img src="/songs/${folder}/cover.jpg" alt="">
            <h2>${response.title}</h2>
            <p>${response.description}</p>
        </div>`;
      } catch (err) {
        console.warn(`Skipping ${folder}: ${err.message}`);
      }
    }
  }
}
async function main() {
  await displayAlbums();
  songs = await getsongs('songs/cs');
  playMusic(songs[0], true);
  updateSongList(songs);

  document.getElementById('play').addEventListener('click', () => {
    if (currentSong.paused) {
      currentSong.play();
      play.src = './img/pause.svg';
    } else {
      currentSong.pause();
      play.src = './img/play.svg';
    }
  });

  currentSong.addEventListener('timeupdate', () => {
    const currentTime = secondsToMinutesSeconds(currentSong.currentTime);
    const duration = secondsToMinutesSeconds(currentSong.duration);
    document.querySelector(
      '.songtime'
    ).innerHTML = `${currentTime} / ${duration}`;
    document.querySelector('.circle').style.left = `${
      (currentSong.currentTime / currentSong.duration) * 100
    }%`;
  });

  document.querySelector('.seekbar').addEventListener('click', (e) => {
    const seekBar = e.currentTarget;
    const offsetX = e.clientX - seekBar.getBoundingClientRect().left;
    const percentage = offsetX / seekBar.offsetWidth;
    currentSong.currentTime = percentage * currentSong.duration;
  });

  document.querySelector('.hamburger').addEventListener('click', () => {
    document.querySelector('.left').style.left = '0';
  });

  document.querySelector('.close').addEventListener('click', () => {
    document.querySelector('.left').style.left = '-120%';
  });

  document.getElementById('previous').addEventListener('click', () => {
    let index = songs.indexOf(currentSong.src.split('/').pop());
    if (index > 0) playMusic(songs[index - 1]);
  });

  document.getElementById('next').addEventListener('click', () => {
    let index = songs.indexOf(currentSong.src.split('/').pop());
    if (index < songs.length - 1) playMusic(songs[index + 1]);
  });

  // Add an event to volume
  document
    .querySelector('.range')
    .getElementsByTagName('input')[0]
    .addEventListener('change', (e) => {
      console.log('Setting volume to', e.target.value, '/ 100');
      currentSong.volume = parseInt(e.target.value) / 100;
      if (currentSong.volume > 0) {
        document.querySelector('.volume>img').src = document
          .querySelector('.volume>img')
          .src.replace('mute.svg', 'volume.svg');
      }
    });

  // Add event listener to mute the track
  document.querySelector('.volume>img').addEventListener('click', (e) => {
    if (e.target.src.includes('volume.svg')) {
      e.target.src = e.target.src.replace('volume.svg', 'mute.svg');
      currentSong.volume = 0;
      document
        .querySelector('.range')
        .getElementsByTagName('input')[0].value = 0;
    } else {
      e.target.src = e.target.src.replace('mute.svg', 'volume.svg');
      currentSong.volume = 0.1;
      document
        .querySelector('.range')
        .getElementsByTagName('input')[0].value = 10;
    }
  });

  Array.from(document.getElementsByClassName('card')).forEach((e) => {
    e.addEventListener('click', async (item) => {
      songs = await getsongs(`songs/${item.currentTarget.dataset.folder}`);
      playMusic(songs[0]); // Automatically play first song
      updateSongList(songs);
    });
  });
}

main();


// ugly code to play music
let audioBuffer;
let context = new AudioContext();
let getSound = new XMLHttpRequest();
getSound.responseType = 'arraybuffer';
getSound.open("GET", "music.mp3", true);
getSound.onload = function() {
    context.decodeAudioData(getSound.response).then(buffer => {
        audioBuffer = buffer; // assign the buffer to a variable that can then be 'played'
        playSound();
    })
};
getSound.send();

function playSound() {
    let playSound = context.createBufferSource();
    playSound.buffer = audioBuffer;
    playSound.connect(context.destination);
    playSound.start(0)
}

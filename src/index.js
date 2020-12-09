import "./styles/index.scss";
import * as Tone from 'tone';

const NOTES = [
    20.60172,
    21.82676,
    24.49971,
    27.50000,
    30.86771,
    32.70320,
    36.70810,
    41.20344,
    43.65353,
    48.99943,
    55.00000,
    61.73541,
    65.40639,
    73.41619,
    82.40689,
    87.30706,
    97.99886,
    110.0000,
    123.4708,
    130.8128,
    146.8324,
    164.8138,
    174.6141,
    195.9977,
    220.0000,
    246.9417,
    261.6256,
    293.6648,
    329.6276,
    349.2282,
    391.9954,
    440.0000,
    493.8833,
    523.2511,
    587.3295,
    659.2551,
    698.4565,
    783.9909,
    880.0000,
    987.7666,
    1046.502,
    1174.659,
    1318.510,
    1396.913,
    1567.982,
    1760.000,
]
function closest(needle, haystack) {
    return haystack.reduce((a, b) => {
        let aDiff = Math.abs(a - Math.abs(needle));
        let bDiff = Math.abs(b - Math.abs(needle));

        if (aDiff == bDiff) {
            return a > b ? a : b;
        } else {
            return bDiff < aDiff ? b : a;
        }
    });
}


window.addEventListener('load', () => {
    //ppts
    let ppts = [];

    //canvas
    const canvas = document.querySelector('#canvas')
    const visualizer = document.querySelector('#visualizer1')
    const container = document.querySelector('#page_container')
    const size = 500;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    canvas.style.backgroundColor = 'black'
    let scale = window.devicePixelRatio;
    canvas.width = Math.floor(size * scale);
    canvas.height = Math.floor(size * scale);
    
    //ctx
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 5;
    
    //oscillator
    let oscillator;
    let oscillator2;
    const sampler = new Tone.Sampler({
        urls: {
            A1: "A1.mp3",
            A2: "A2.mp3",
        },
        baseUrl: "https://tonejs.github.io/audio/casio/",
        onload: () => {
           
        }
    }).toDestination();
    sampler.gain = 0.1;
    const reverb = new Tone.Reverb({decay: 7})
    const fft = new Tone.Analyser({size: 256})
    sampler.connect(reverb)
    sampler.connect(fft)
    reverb.toDestination()
    const ac = new AudioContext();
    const ac2 = new AudioContext();
    const panNode = ac.createStereoPanner();
    const panNode2 = ac2.createStereoPanner();
    const gainNode = ac.createGain();
    const gainNode2 = ac2.createGain();
    panNode.pan.value = 1;
    panNode2.pan.value = -1;
    panNode.connect(gainNode);
    panNode2.connect(gainNode2);
    gainNode.connect(ac.destination);
    gainNode2.connect(ac2.destination);
    
    //drawing
    let drawing = false;
    
    drawVisualizer()
    resizeVisualizer()

    function startPosition(e) {
        drawing = true;

        draw(e);
    }

    function finishedPosition() {
        drawing = false;
        ppts = [];
 
        
        ctx.beginPath();

    }
    
    function draw(e) {
        if(!drawing) return ;

        const mouse = {x: 0, y: 0};
        mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
        mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;
        ppts.push({x: mouse.x, y: mouse.y});
        
        gainNode.gain.exponentialRampToValueAtTime(((mouse.x / size) * 0.1), 0.1);
        gainNode2.gain.exponentialRampToValueAtTime(((mouse.y / size) * 0.1), 0.1);

        sampler.triggerAttackRelease(closest(mouse.y - 20, NOTES), ac2.currentTime + 0.01);
        
        ctx.strokeStyle = `rgb(${(255/ size) * mouse.x}, ${(255/ size) * mouse.y}, 155)`;
        ctx.shadowColor = `rgba(${(255/ size) * mouse.y}, 0, ${(255/ size) * mouse.x}, .5)`;
   
        if (ppts.length < 6) {
            let b = ppts[0];
            ctx.beginPath(), ctx.arc(b.x, b.y, ctx.lineWidth / 2, 0, Math.PI * 2, !0), ctx.closePath(), ctx.fill();
            return
        }
        ctx.beginPath(), ctx.moveTo(ppts[0].x, ppts[0].y);
        // draw a bunch of quadratics, using the average of two ppts as the control point
        for (var i = 1; i < ppts.length - 2; i++) {
            let c = (ppts[i].x + ppts[i + 1].x) / 2,
                d = (ppts[i].y + ppts[i + 1].y) / 2;
            ctx.quadraticCurveTo(ppts[i].x, ppts[i].y, c, d)
        }
        ctx.quadraticCurveTo(ppts[i].x, ppts[i].y, ppts[i + 1].x, ppts[i + 1].y), ctx.stroke()
        
    }

    function drawVisualizer() {
        requestAnimationFrame(drawVisualizer)
    
        let dataArray = fft.getValue()
        const width = visualizer.width
        const height = visualizer.height
        const barWidth = width / 256

        const canvasContext = visualizer.getContext('2d')
        canvasContext.clearRect(0, 0, width, height)
        

        dataArray.forEach((item, index) => {
            if (Math.abs(item) !== Infinity) {     
                
                const y = Math.abs(item)
                const x = barWidth * index 
    
                canvasContext.fillStyle = `hsl(${y / height * 90 + 150}, 100%, 20%)`
                canvasContext.fillRect(x, height - y - (height / 2), barWidth, y - item)
            }
            
        })
    }    

    function resizeVisualizer() {
        visualizer.width = visualizer.clientWidth * scale
        visualizer.height = visualizer.clientHeight * scale
    }
    
    canvas.addEventListener('mousedown', startPosition)
    canvas.addEventListener('mouseup', finishedPosition)
    canvas.addEventListener('mousemove', draw)
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return false;
    })
    container.addEventListener('mouseover', finishedPosition)
   
});
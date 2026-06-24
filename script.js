let array = [];
let steps = [];
let currentStep = 0;
let history = [];
let lastVisualState = {};
let maxSteps = 0;
let comparisons = 0;
let swaps = 0;
let score = Number(localStorage.getItem("sortquest_score") || 0);
let isPaused = false;
let isAnimating = false;
let isStepping = false;
let soundEnabled = localStorage.getItem("sortquest_sound") !== "off";
let animationSpeed = Number(localStorage.getItem("sortquest_speed") || 700);

// Web Audio API kontekst
let audioContext;
function initAudioContext() {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API nije dostupan:", e);
    }
  }
  return audioContext;
}

let audioUnlocked = false;
async function unlockAudio() {
  if (!soundEnabled) return;

  const ctx = initAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    audioUnlocked = ctx.state === "running";
  } catch (e) {
    console.warn("Zvuk nije mogao biti otključan:", e);
  }
}

const arrayContainer = document.getElementById("arrayContainer");
const comparisonsEl = document.getElementById("comparisons");
const swapsEl = document.getElementById("swaps");
const stepCounterEl = document.getElementById("stepCounter");
const scoreBox = document.getElementById("scoreBox");
const tutorMessage = document.getElementById("tutorMessage");
const complexityBox = document.getElementById("complexityBox");
const tutorImage = document.getElementById("tutorImage");
const algorithmIcon = document.getElementById("algorithmIcon");
const algorithmTitle = document.getElementById("algorithmTitle");
const algorithmShortText = document.getElementById("algorithmShortText");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const stepExplanation = document.getElementById("stepExplanation");
const pseudoCodeList = document.getElementById("pseudoCodeList");
const learningPathList = document.getElementById("learningPathList");

const algorithmData = {
  bubble: {
    name: "Bubble Sort",
    icon: "assets/images/bubble-icon.png",
    short: "Poredi susjedne elemente i veće pomjera ka kraju niza.",
    complexity: "Best: O(n) | Average: O(n²) | Worst: O(n²)\n\n💡 Najjednostavniji za učenje, ali najsporiji.",
    explanation: "Bubble Sort više puta prolazi kroz niz i poredi susjedne elemente. Ako su pogrešno poređani, zamijeni ih. Proces se ponavlja dok niz ne bude sortiran.",
    hint: "👉 Gledaj dva susjedna elementa. Ako je lijevi veći, treba zamjena mjesta!",
    tips: [
      "Vidi kako se veći elementi 'mjehurićasto' prema kraju",
      "Svaki prolaz donosi jedan element na mjesto",
      "Najjednostavniji za razumijevanje"
    ]
  },
  selection: {
    name: "Selection Sort",
    icon: "assets/images/selection-icon.png",
    short: "Traži najmanji element i stavlja ga na početak nesortiranog dijela.",
    complexity: "Best: O(n²) | Average: O(n²) | Worst: O(n²)\n\n💡 Uvijek ista brzina bez obzira na ulaz.",
    explanation: "Selection Sort u svakom prolazu traži najmanji element u nesortiranom dijelu i postavlja ga na početak. Proces se ponavlja dok sve elemente nije sortirano.",
    hint: "👉 U svakom koraku, pronađi najmanji element u nesortiranom dijelu!",
    tips: [
      "Pronalazi najmanji element",
      "Stavlja ga na početak nesortiranog dijela",
      "Uvijek O(n²) bez obzira na ulaz"
    ]
  },
  insertion: {
    name: "Insertion Sort",
    icon: "assets/images/insertion-icon.png",
    short: "Ubacuje trenutni element na pravo mjesto u sortiranom dijelu.",
    complexity: "Best: O(n) | Average: O(n²) | Worst: O(n²)\n\n💡 Odličan za skoro sortirane nizove!",
    explanation: "Insertion Sort gradi sortirani dio niza tako što svaki novi element ubacuje na pravo mjesto. Kao slaganje karata u ruci - svaka nova karta ide na tačnu poziciju.",
    hint: "👉 Zamisli kako slažeš karte u ruci - svaka nova karta ide na tačnu poziciju!",
    tips: [
      "Kao slaganje karata u ruci",
      "Gradi sortirani niz od lijeva na desno",
      "Brz za skoro sortirane nizove"
    ]
  },
  merge: {
    name: "Merge Sort",
    icon: "assets/images/merge-icon.png",
    short: "Dijeli niz na manje dijelove, sortira ih i spaja.",
    complexity: "Best: O(n log n) | Average: O(n log n) | Worst: O(n log n)\n\n💡 Uvijek brz, ali koristi dodatnu memoriju!",
    explanation: "Merge Sort koristi princip 'podijeli pa vladaj'. Niz se dijeli na polovine, zatim se sortirani dijelovi spajaju. Garantovana je O(n log n) brzina.",
    hint: "👉 Prvo podijeli niz na polovine, zatim spajaj manje sortirane dijelove!",
    tips: [
      "Koristi 'podijeli pa vladaj' strategiju",
      "Dijeli niz dok nemaš po jedan element",
      "Onda spaja sortirane dijelove"
    ]
  },
  quick: {
    name: "Quick Sort",
    icon: "assets/images/quick-icon.png",
    short: "Bira pivot i dijeli niz na manje i veće elemente.",
    complexity: "Best: O(n log n) | Average: O(n log n) | Worst: O(n²)\n\n💡 Obično najbrži u praksi!",
    explanation: "Quick Sort bira pivot (referentni element), zatim elemente manje od pivota stavlja lijevo, a veće desno. Proces se ponavlja za lijevi i desni dio.",
    hint: "👉 Pronađi pivot. Manji elementi idu lijevo, veći elementi idu desno!",
    tips: [
      "Bira pivot element",
      "Dijeli niz na dva dijela",
      "Obično najbrži u praksi"
    ]
  }
};

const pseudoCodeData = {
  bubble: [
    "Prođi kroz niz više puta",
    "Poredi dva susjedna elementa",
    "Ako je lijevi veći, zamijeni ih",
    "Na kraju prolaza najveći element je desno"
  ],
  selection: [
    "Kreni od prvog nesortiranog mjesta",
    "Traži najmanji element u ostatku niza",
    "Zapamti poziciju najmanjeg elementa",
    "Zamijeni ga sa prvim nesortiranim mjestom"
  ],
  insertion: [
    "Uzmi novi element iz nesortiranog dijela",
    "Poredi ga sa elementima lijevo",
    "Pomjeraj veće elemente udesno",
    "Ubaci element na tačnu poziciju"
  ],
  merge: [
    "Podijeli niz na dvije polovine",
    "Sortiraj lijevu i desnu polovinu",
    "Poredi početke oba podniza",
    "Spajaj manje vrijednosti u novi sortirani niz"
  ],
  quick: [
    "Izaberi pivot element",
    "Poredi ostale elemente sa pivotom",
    "Manje vrijednosti premjesti lijevo",
    "Ponovi postupak za lijevi i desni dio"
  ]
};

const learningPathOrder = ["bubble", "selection", "insertion", "merge", "quick"];

const beginnerExplanations = {
  bubble: "Bubble Sort je kao guranje najvećeg broja ka kraju niza. Porediš dva susjedna broja; ako su na pogrešnom mjestu, zamijeniš ih.",
  selection: "Selection Sort je kao da uvijek tražiš najmanji broj iz gomile i stavljaš ga na prvo slobodno mjesto.",
  insertion: "Insertion Sort je kao slaganje karata u ruci. Uzmeš novu kartu i ubaciš je tamo gdje pripada.",
  merge: "Merge Sort prvo razbije veliki problem na male dijelove, a zatim ih spaja redom dok ne dobije sortiran niz.",
  quick: "Quick Sort izabere jedan broj kao pivot. Manji brojevi idu lijevo, veći desno, pa se isto ponavlja za oba dijela."
};

// WEB AUDIO API ZVUKOVI
function playToneSound(frequency, duration, type = "sine") {
  if (!soundEnabled) return;

  try {
    const ctx = initAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn("Greška pri reprodukciji tona:", e);
  }
}

function playClickSound() {
  playToneSound(800, 0.05, "sine");
}

function playCompareSound() {
  playToneSound(600, 0.1, "sine");
}

function playSwapSound() {
  playToneSound(500, 0.15, "sine");
}

function playCorrectSound() {
  playToneSound(800, 0.1, "sine");
  setTimeout(() => playToneSound(1000, 0.1, "sine"), 100);
  setTimeout(() => playToneSound(1200, 0.15, "sine"), 200);
}

function playWrongSound() {
  playToneSound(300, 0.2, "sine");
  setTimeout(() => playToneSound(200, 0.2, "sine"), 150);
}

function playHintSound() {
  playToneSound(1000, 0.05, "sine");
  setTimeout(() => playToneSound(1200, 0.05, "sine"), 50);
}

function playSuccessSound() {
  playToneSound(523.25, 0.1, "sine");
  setTimeout(() => playToneSound(659.25, 0.1, "sine"), 100);
  setTimeout(() => playToneSound(783.99, 0.2, "sine"), 200);
}

function playSound(id) {
  if (!soundEnabled) return;

  try {
    const originalSound = document.getElementById(id);

    if (!originalSound) {
      console.warn("Audio element ne postoji:", id);
      return;
    }

    const sound = originalSound.cloneNode(true);
    sound.volume = 0.6;
    sound.playbackRate = 1.0;

    const playPromise = sound.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        playFallbackSound(id);
      });
    }
  } catch (e) {
    console.error("Greška pri reprodukciji zvuka:", e);
    playFallbackSound(id);
  }
}

function playFallbackSound(id) {
  if (!soundEnabled) return;

  const soundMap = {
    "clickSound": playClickSound,
    "compareSound": playCompareSound,
    "swapSound": playSwapSound,
    "correctSound": playCorrectSound,
    "wrongSound": playWrongSound,
    "hintSound": playHintSound,
    "levelCompleteSound": playSuccessSound,
    "tutorCompleteSound": playSuccessSound,
    "scoreSound": playClickSound,
    "hoverSound": playHintSound,
    "startSound": playClickSound,
    "pauseSound": playClickSound,
    "resumeSound": playClickSound,
    "resetSound": playClickSound,
    "menuOpenSound": playClickSound,
    "overwriteSound": playSwapSound,
    "quizSound": playClickSound,
    "achievementSound": playSuccessSound,
    "battleStartSound": playClickSound,
    "battleWinSound": playSuccessSound,
    "tutorOpenSound": playHintSound,
    "tutorHappySound": playSuccessSound,
    "tutorThinkingSound": playHintSound,
    "tutorWarningSound": playWrongSound,
    "bubblePopSound": playSwapSound,
    "selectionScanSound": playCompareSound,
    "insertionPlaceSound": playSwapSound,
    "mergeSplitSound": playCompareSound,
    "mergeCombineSound": playSwapSound,
    "quickPivotSound": playCompareSound,
    "quickPartitionSound": playSwapSound
  };

  const soundFunc = soundMap[id];
  if (soundFunc) {
    soundFunc();
  }
}

function stopAllMusic() {
  ["backgroundMusic", "challengeMusic", "battleMusic", "quizMusic", "successMusic"].forEach(id => {
    const music = document.getElementById(id);

    if (music) {
      music.pause();
      music.currentTime = 0;
    }
  });
}

function playMusic(id, volume = 0.45) {
  if (!soundEnabled) return;

  try {
    stopAllMusic();

    const music = document.getElementById(id);

    if (music) {
      music.volume = volume;
      music.currentTime = 0;
      
      const playPromise = music.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          console.warn("Nije moguće reproducirati muziku:", id);
        });
      }
    }
  } catch (e) {
    console.error("Greška pri reprodukciji muzike:", e);
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem("sortquest_sound", soundEnabled ? "on" : "off");
  
  const btn = document.getElementById("soundToggleBtn");
  if (btn) {
    btn.textContent = soundEnabled ? "🔊" : "🔇";
    btn.classList.toggle('sound-off', !soundEnabled);
  }

  updateSoundUi();

  if (soundEnabled) {
    unlockAudio().then(() => {
      playClickSound();
      playMusic("backgroundMusic");
    });
  } else {
    stopAllMusic();
  }
}

function showScreen(screenId) {
  if (soundEnabled) {
    playClickSound();
    setTimeout(() => playClickSound(), 50);
  }

  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  const targetScreen = document.getElementById(screenId);

  if (!targetScreen) {
    console.error("Screen ne postoji:", screenId);
    return;
  }

  targetScreen.classList.add("active");

  if (["splash", "learn", "settings", "help", "leaderboard"].includes(screenId)) {
    playMusic("backgroundMusic");
  }

  if (screenId === "challenge") {
    playMusic("challengeMusic");
  }

  if (screenId === "battle") {
    playMusic("battleMusic");
  }

  if (screenId === "quiz") {
    playHintSound();
    playMusic("quizMusic");
    showQuiz();
  }

  if (screenId === "leaderboard") {
    showLeaderboard();
  }
}

function getArraySize() {
  const sizeSelect = document.getElementById("arraySizeSelect");
  if (!sizeSelect) return 12;
  
  const size = Number(sizeSelect.value);
  return size || 12;
}

function getMaxValue() {
  const maxSelect = document.getElementById("maxValueSelect");
  if (!maxSelect) return 50;
  
  const max = Number(maxSelect.value);
  return max || 50;
}

function newArray() {
  if (isAnimating) return;

  const size = getArraySize();
  const max = getMaxValue();

  array = Array.from({ length: size }, () => Math.floor(Math.random() * max) + 1);
  steps = [];
  currentStep = 0;
  comparisons = 0;
  swaps = 0;
  isPaused = false;
  isStepping = false;
  history = [];
  lastVisualState = {};
  maxSteps = 0;

  updateStats();
  renderArray();
  setTutorState("neutral");
  updateProgress();

  if (tutorMessage) {
    tutorMessage.textContent = "✨ Novi niz je generisan. Klikni Start ili koristi Korak za detaljno praćenje.";
  }

  updateStepExplanation("Novi niz je spreman. Pokušaj prvo predvidjeti šta će algoritam uraditi.");
}

function renderArray(highlight = [], swapHighlight = [], sorted = [], visualState = {}) {
  if (!arrayContainer) return;

  lastVisualState = visualState || {};
  arrayContainer.innerHTML = "";

  const pivot = lastVisualState.pivot;
  const min = lastVisualState.min;
  const active = lastVisualState.active;
  const range = lastVisualState.range || [];

  array.forEach((value, index) => {
    const bar = document.createElement("div");

    bar.className = "bar";
    bar.style.height = `${value * 2}px`;
    bar.textContent = value;
    bar.title = `Pozicija ${index + 1}, vrijednost ${value}`;

    if (highlight.includes(index)) bar.classList.add("compare");
    if (swapHighlight.includes(index)) bar.classList.add("swap");
    if (sorted.includes(index)) bar.classList.add("sorted");
    if (index === pivot) bar.classList.add("pivot");
    if (index === min) bar.classList.add("minimum");
    if (index === active) bar.classList.add("active-item");
    if (range.length === 2 && index >= range[0] && index <= range[1]) bar.classList.add("range-item");

    arrayContainer.appendChild(bar);
  });
}

function updateStepExplanation(text) {
  if (stepExplanation) {
    stepExplanation.textContent = text;
  }
}

function updatePseudocode() {
  const selected = document.getElementById("algorithmSelect")?.value || "bubble";
  const lines = pseudoCodeData[selected] || [];

  if (!pseudoCodeList) return;

  pseudoCodeList.innerHTML = lines.map((line, index) => `
    <li data-line="${index}">${line}</li>
  `).join("");
}

function markPseudoLine(lineIndex) {
  if (!pseudoCodeList) return;

  pseudoCodeList.querySelectorAll("li").forEach(li => li.classList.remove("active-line"));

  const line = pseudoCodeList.querySelector(`[data-line="${lineIndex}"]`);
  if (line) line.classList.add("active-line");
}

function saveHistory() {
  history.push({
    array: [...array],
    currentStep,
    comparisons,
    swaps,
    visualState: { ...lastVisualState }
  });
}

function stepBackward() {
  if (isAnimating) {
    isPaused = true;
    updateStepExplanation("Animacija je pauzirana. Sada možeš ići korak nazad.");
  }

  if (history.length === 0) {
    updateStepExplanation("Nema prethodnog koraka. Već si na početku animacije.");
    playWrongSound();
    return;
  }

  const previous = history.pop();
  array = [...previous.array];
  currentStep = previous.currentStep;
  comparisons = previous.comparisons;
  swaps = previous.swaps;
  lastVisualState = previous.visualState || {};

  renderArray([], [], [], lastVisualState);
  updateStats();
  updateProgress();
  updateStepExplanation("Vratio/la si se jedan korak nazad. Pokušaj ponovo razumjeti ovaj trenutak.");
  markPseudoLine(Math.max(0, Math.min(3, currentStep % 4)));
  playClickSound();
}

function updateLearningPath() {
  if (!learningPathList) return;

  const achievements = JSON.parse(localStorage.getItem("sortquest_achievements") || "[]");
  const completed = JSON.parse(localStorage.getItem("sortquest_completed_algorithms") || "[]");
  const hasAnyProgress = achievements.length > 0 || completed.length > 0;

  learningPathList.innerHTML = learningPathOrder.map((algo, index) => {
    const isDone = completed.includes(algo);
    const isUnlocked = index === 0 || completed.includes(learningPathOrder[index - 1]) || hasAnyProgress;
    const icon = isDone ? "✅" : isUnlocked ? "🔓" : "🔒";
    return `<li class="${isDone ? "path-done" : isUnlocked ? "path-open" : "path-locked"}">${icon} ${algorithmData[algo].name}</li>`;
  }).join("");
}

function markAlgorithmCompleted(algo) {
  const completed = JSON.parse(localStorage.getItem("sortquest_completed_algorithms") || "[]");
  if (!completed.includes(algo)) {
    completed.push(algo);
    localStorage.setItem("sortquest_completed_algorithms", JSON.stringify(completed));
  }
  updateLearningPath();
}

function updateStats() {
  if (comparisonsEl) comparisonsEl.textContent = comparisons;
  if (swapsEl) swapsEl.textContent = swaps;
  if (stepCounterEl) stepCounterEl.textContent = currentStep;
  if (scoreBox) scoreBox.textContent = score;
}

function updateProgress() {
  if (maxSteps === 0) {
    if (progressFill) progressFill.style.width = "0%";
    if (progressText) progressText.textContent = "0%";
    return;
  }

  const percent = Math.min(100, Math.round((currentStep / maxSteps) * 100));
  if (progressFill) progressFill.style.width = percent + "%";
  if (progressText) progressText.textContent = percent + "%";
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function setTutorState(state) {
  const images = {
    neutral: "assets/images/tutor-neutral.png",
    happy: "assets/images/tutor-happy.png",
    thinking: "assets/images/tutor-thinking.png",
    warning: "assets/images/tutor-warning.png",
    complete: "assets/images/tutor-complete.png"
  };

  if (tutorImage) {
    tutorImage.src = images[state] || images.neutral;
    tutorImage.classList.add('tutor-animate');
    
    setTimeout(() => {
      tutorImage.classList.remove('tutor-animate');
    }, 300);
  }
}

function algorithmChanged() {
  const selected = document.getElementById("algorithmSelect").value;
  const data = algorithmData[selected];

  if (algorithmIcon) algorithmIcon.src = data.icon;
  if (algorithmTitle) algorithmTitle.textContent = data.name;
  if (algorithmShortText) algorithmShortText.textContent = data.short;
  if (complexityBox) complexityBox.textContent = data.complexity;

  const learningTips = document.getElementById("learningTips");
  if (learningTips && data.tips) {
    learningTips.innerHTML = data.tips.map(tip => `<li>${tip}</li>`).join("");
  }

  updatePseudocode();
  markPseudoLine(0);
  updateLearningPath();
  setTutorState("neutral");
  explainAlgorithm();
}

function generateSteps() {
  const selected = document.getElementById("algorithmSelect").value;
  const copy = [...array];

  if (selected === "bubble") steps = bubbleSortSteps(copy);
  if (selected === "selection") steps = selectionSortSteps(copy);
  if (selected === "insertion") steps = insertionSortSteps(copy);
  if (selected === "merge") steps = mergeSortSteps(copy);
  if (selected === "quick") steps = quickSortSteps(copy);

  maxSteps = steps.length;
  history = [];
  updatePseudocode();
  updateStepExplanation(`Generisano je ${maxSteps} koraka za ${algorithmData[selected].name}.`);

  if (complexityBox) {
    complexityBox.textContent = algorithmData[selected].complexity;
  }
}

function executeStep(step) {
  const selected = document.getElementById("algorithmSelect")?.value || "bubble";
  saveHistory();
  currentStep++;

  if (step.type === "compare") {
    comparisons++;
    playCompareSound();
    const [a, b] = step.indices;
    const text = `🔍 Poređenje: gledam pozicije ${a + 1} i ${b + 1}. Vrijednosti su ${array[a]} i ${array[b]}.`;
    if (tutorMessage) tutorMessage.textContent = text;
    updateStepExplanation(`${text} Ako redoslijed nije dobar, slijedi zamjena ili premještanje.`);
    markPseudoLine(selected === "bubble" ? 1 : selected === "selection" ? 1 : selected === "insertion" ? 1 : selected === "merge" ? 2 : 1);
    renderArray(step.indices, [], [], step.visual || {});
  }

  if (step.type === "min") {
    playHintSound();
    const text = `⭐ Novi trenutni minimum je ${array[step.index]} na poziciji ${step.index + 1}.`;
    if (tutorMessage) tutorMessage.textContent = text;
    updateStepExplanation("Selection Sort pamti najmanji pronađeni element i kasnije ga mijenja sa početkom nesortiranog dijela.");
    markPseudoLine(2);
    renderArray([], [], [], { min: step.index, range: step.range });
  }

  if (step.type === "swap") {
    swaps++;
    playSwapSound();

    const [i, j] = step.indices;
    const oldA = array[i];
    const oldB = array[j];
    [array[i], array[j]] = [array[j], array[i]];

    const text = `🔄 Zamjena: ${oldA} ↔ ${oldB}.`;
    if (tutorMessage) tutorMessage.textContent = text;
    updateStepExplanation(`${text} Ovo fizički mijenja redoslijed elemenata u nizu.`);
    markPseudoLine(selected === "selection" ? 3 : selected === "quick" ? 2 : selected === "insertion" ? 2 : 2);
    renderArray([], step.indices, [], step.visual || {});
  }

  if (step.type === "overwrite") {
    playSwapSound();
    const oldValue = array[step.index];
    array[step.index] = step.value;

    const text = `✏️ Upis: na poziciju ${step.index + 1} ide vrijednost ${step.value}.`;
    if (tutorMessage) tutorMessage.textContent = text;
    updateStepExplanation(`${text} Stara vrijednost na toj poziciji bila je ${oldValue}. Ovo je tipično za Merge Sort.`);
    markPseudoLine(3);
    renderArray([step.index], [], [], { active: step.index, range: step.range });
  }

  if (step.type === "split") {
    playCompareSound();
    const [start, mid, end] = step.indices;
    if (tutorMessage) tutorMessage.textContent = "📂 Merge Sort dijeli niz na manje dijelove.";
    updateStepExplanation(`Merge Sort dijeli dio niza od pozicije ${start + 1} do ${end} na dva manja dijela.`);
    markPseudoLine(0);
    renderArray([], [], [], { range: [start, end - 1], split: [start, mid, end] });
  }

  if (step.type === "pivot") {
    playHintSound();
    const pivotIndex = step.indices[0];
    if (tutorMessage) tutorMessage.textContent = `🎯 Pivot je ${array[pivotIndex]} na poziciji ${pivotIndex + 1}.`;
    updateStepExplanation("Quick Sort koristi pivot kao granicu: manje vrijednosti idu lijevo, veće desno.");
    markPseudoLine(0);
    renderArray([], [], [], { pivot: pivotIndex, range: step.range });
  }

  updateStats();
  updateProgress();
}

function finishAnimation() {
  renderArray([], [], array.map((_, i) => i));
  updateProgress();
  updateStepExplanation("Niz je sortiran. Sada možeš riješiti kviz ili pokušati drugi algoritam.");

  if (tutorMessage) {
    tutorMessage.textContent = "🎉 Bravo! Niz je savršeno sortiran. Kviz je otkljušan!";
  }

  const selected = document.getElementById("algorithmSelect")?.value || "bubble";
  markAlgorithmCompleted(selected);
  setTutorState("complete");
  playCorrectSound();
  setTimeout(() => playSuccessSound(), 300);
}

async function startAnimation() {
  if (isAnimating) return;

  if (soundEnabled) playClickSound();
  setTutorState("thinking");

  if (array.length === 0) newArray();
  generateSteps();

  currentStep = 0;
  comparisons = 0;
  swaps = 0;
  history = [];
  isPaused = false;
  isStepping = false;
  resetPauseButtonLabel();
  isAnimating = true;

  updateStats();
  updateProgress();

  for (const step of steps) {
    if (!isAnimating) break;

    while (isPaused && !isStepping) {
      await sleep(200);
    }

    executeStep(step);

    if (isStepping) {
      isStepping = false;
      isPaused = true;
    }

    await sleep(animationSpeed);
  }

  if (currentStep >= steps.length) {
    finishAnimation();
    saveScore();
    unlockAchievement("Prvi algoritam završen");

    setTimeout(() => {
      showScreen("quiz");
    }, 1200);
  }

  isAnimating = false;
  resetPauseButtonLabel();
}

function pauseAnimation() {
  if (!isAnimating) return;

  isPaused = !isPaused;
  playClickSound();

  // Ne mijenjamo poruku AI tutora tokom pauze.
  // Tako korisnik može pročitati tačno ono objašnjenje gdje je animacija stala.
  const pauseBtn = document.querySelector(".btn-pause");
  if (pauseBtn) {
    pauseBtn.textContent = isPaused ? "▶️ Nastavi" : "⏸️ Pauza";
    pauseBtn.title = isPaused ? "Nastavi animaciju" : "Pauziraj";
  }
}

function resetPauseButtonLabel() {
  const pauseBtn = document.querySelector(".btn-pause");
  if (pauseBtn) {
    pauseBtn.textContent = "⏸️ Pauza";
    pauseBtn.title = "Pauziraj";
  }
}

function stepForward() {
  if (isAnimating) {
    isStepping = true;
    isPaused = false;

    const pauseBtn = document.querySelector(".btn-pause");
    if (pauseBtn) {
      pauseBtn.textContent = "▶️ Nastavi";
      pauseBtn.title = "Nastavi animaciju";
    }

    return;
  }

  if (currentStep === 0 || steps.length === 0) {
    if (array.length === 0) newArray();
    generateSteps();
    setTutorState("thinking");
  }

  if (currentStep < steps.length) {
    const step = steps[currentStep];
    executeStep(step);

    if (currentStep === steps.length) {
      finishAnimation();
      unlockAchievement("Algoritam odrađen korak po korak");
    }
  } else {
    updateStepExplanation("Već si na kraju animacije. Klikni Novi niz ili Reset za novi pokušaj.");
  }
}

function resetGame() {
  playClickSound();
  isAnimating = false;
  isPaused = false;
  isStepping = false;
  history = [];
  newArray();
}

function showHint() {
  playHintSound();
  setTutorState("thinking");

  const selected = document.getElementById("algorithmSelect").value;

  if (tutorMessage) {
    tutorMessage.textContent = algorithmData[selected].hint;
  }
}

function explainAlgorithm() {
  playHintSound();
  setTutorState("neutral");

  const selected = document.getElementById("algorithmSelect").value;

  if (tutorMessage) {
    tutorMessage.textContent = algorithmData[selected].explanation;
  }

  updateStepExplanation("Pročitaj objašnjenje, zatim koristi Korak da povežeš tekst sa animacijom.");
}

function explainLikeBeginner() {
  playHintSound();
  setTutorState("happy");

  const selected = document.getElementById("algorithmSelect").value;
  const text = beginnerExplanations[selected] || algorithmData[selected].explanation;

  if (tutorMessage) {
    tutorMessage.textContent = `👶 ${text}`;
  }

  updateStepExplanation("Ovo je kratko objašnjenje bez komplikovanih termina. Nakon toga probaj jedan korak naprijed.");
}

function changeAnimationSpeed() {
  const speedSelect = document.getElementById("speedSelect");
  if (speedSelect) {
    animationSpeed = Number(speedSelect.value);
    localStorage.setItem("sortquest_speed", animationSpeed);
  }
}

/* ALGORITMI */

function bubbleSortSteps(arr) {
  const result = [];

  for (let i = 0; i < arr.length - 1; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      result.push({ type: "compare", indices: [j, j + 1] });

      if (arr[j] > arr[j + 1]) {
        result.push({ type: "swap", indices: [j, j + 1] });
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }

  return result;
}

function selectionSortSteps(arr) {
  const result = [];

  for (let i = 0; i < arr.length - 1; i++) {
    let minIndex = i;

    for (let j = i + 1; j < arr.length; j++) {
      result.push({ type: "compare", indices: [minIndex, j] });

      if (arr[j] < arr[minIndex]) {
        minIndex = j;
        result.push({ type: "min", index: minIndex, range: [i, arr.length - 1] });
      }
    }

    if (minIndex !== i) {
      result.push({ type: "swap", indices: [i, minIndex] });
      [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
    }
  }

  return result;
}

function insertionSortSteps(arr) {
  const result = [];

  for (let i = 1; i < arr.length; i++) {
    let j = i;

    while (j > 0) {
      result.push({ type: "compare", indices: [j - 1, j] });

      if (arr[j - 1] > arr[j]) {
        result.push({ type: "swap", indices: [j - 1, j] });
        [arr[j - 1], arr[j]] = [arr[j], arr[j - 1]];
        j--;
      } else {
        break;
      }
    }
  }

  return result;
}

function mergeSortSteps(arr) {
  const result = [];

  function mergeSort(start, end) {
    if (end - start <= 1) return;

    const mid = Math.floor((start + end) / 2);

    result.push({ type: "split", indices: [start, mid, end] });

    mergeSort(start, mid);
    mergeSort(mid, end);

    const left = arr.slice(start, mid);
    const right = arr.slice(mid, end);

    let i = 0;
    let j = 0;
    let k = start;

    while (i < left.length && j < right.length) {
      result.push({ type: "compare", indices: [start + i, mid + j] });

      if (left[i] <= right[j]) {
        arr[k] = left[i];
        result.push({ type: "overwrite", index: k, value: left[i], range: [start, end - 1] });
        i++;
      } else {
        arr[k] = right[j];
        result.push({ type: "overwrite", index: k, value: right[j], range: [start, end - 1] });
        j++;
      }

      k++;
    }

    while (i < left.length) {
      arr[k] = left[i];
      result.push({ type: "overwrite", index: k, value: left[i], range: [start, end - 1] });
      i++;
      k++;
    }

    while (j < right.length) {
      arr[k] = right[j];
      result.push({ type: "overwrite", index: k, value: right[j], range: [start, end - 1] });
      j++;
      k++;
    }
  }

  mergeSort(0, arr.length);

  return result;
}

function quickSortSteps(arr) {
  const result = [];

  function partition(low, high) {
    const pivot = arr[high];
    let i = low - 1;

    result.push({ type: "pivot", indices: [high], range: [low, high] });

    for (let j = low; j < high; j++) {
      result.push({ type: "compare", indices: [j, high], visual: { pivot: high, range: [low, high] } });

      if (arr[j] < pivot) {
        i++;

        if (i !== j) {
          result.push({ type: "swap", indices: [i, j] });
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
      }
    }

    result.push({ type: "swap", indices: [i + 1, high] });
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];

    return i + 1;
  }

  function quickSort(low, high) {
    if (low < high) {
      const pi = partition(low, high);

      quickSort(low, pi - 1);
      quickSort(pi + 1, high);
    }
  }

  quickSort(0, arr.length - 1);

  return result;
}

/* CHALLENGE */

let challengeStreak = Number(localStorage.getItem("sortquest_challenge_streak") || 0);

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function makeSmallArray(size = 5, max = 20) {
  return Array.from({ length: size }, () => randomInt(1, max));
}

function getChallengeDifficulty() {
  return document.getElementById("challengeDifficulty")?.value || "easy";
}

function getChallengeRange() {
  const difficulty = getChallengeDifficulty();
  if (difficulty === "hard") return { max: 60, size: 7, label: "Teže" };
  if (difficulty === "normal") return { max: 35, size: 6, label: "Normalno" };
  return { max: 20, size: 5, label: "Lagano" };
}

function getSelectedChallengeAlgorithm() {
  const challengeSelect = document.getElementById("challengeAlgo");

  if (challengeSelect && challengeSelect.value !== "current") {
    return challengeSelect.value;
  }

  return document.getElementById("algorithmSelect")?.value || "bubble";
}

function renderChallengeQuestion({ algo, title, skill, question, visual, answers }) {
  const box = document.getElementById("challengeBox");
  if (!box) return;

  box.innerHTML = `
    <div class="challenge-content challenge-card">
      <div class="challenge-card-header">
        <div>
          <span class="challenge-kicker">${getAlgorithmName(algo)} · ${getChallengeRange().label}</span>
          <h3>${title}</h3>
        </div>
        <span class="challenge-streak-pill">🔥 Streak: ${challengeStreak}</span>
      </div>

      <div class="challenge-skill-box">
        <strong>Šta vježbaš?</strong>
        <span>${skill}</span>
      </div>

      <p class="challenge-question">${question}</p>
      ${visual || ""}

      <div class="challenge-buttons smart-challenge-buttons">
        ${answers.map((answer, index) => `
          <button class="quiz-answer challenge-answer-btn" onclick="checkChallengeAnswer(${answer.correct}, '${escapeForOnclick(answer.explanation)}')">
            <span class="answer-letter">${String.fromCharCode(65 + index)}</span>
            ${answer.label}
          </button>
        `).join("")}
      </div>
      <p id="challengeAnswer"></p>
    </div>
  `;

  addHoverSounds();
}

function startChallenge() {
  const selected = getSelectedChallengeAlgorithm();
  const challengeRange = getChallengeRange();
  playClickSound();

  if (selected === "bubble") {
    const a = randomInt(1, challengeRange.max);
    const b = randomInt(1, challengeRange.max);
    const shouldSwap = a > b;

    renderChallengeQuestion({
      algo: selected,
      title: "⚡ Predvidi zamjenu",
      skill: "Bubble Sort učiš tako što prepoznaješ kada dva susjedna elementa treba zamijeniti.",
      question: `Ako Bubble Sort poredi <b>${a}</b> i <b>${b}</b>, da li treba zamjena?`,
      visual: `<div class="challenge-array visual-pair"><span>${a}</span><span>${b}</span></div>`,
      answers: shuffleArray([
        { label: "Da, treba zamjena", correct: shouldSwap, explanation: shouldSwap ? `Tačno! ${a} je veće od ${b}, pa veći element ide desno.` : `Nije tačno. ${a} nije veće od ${b}, par je već dobro poređan.` },
        { label: "Ne, ostaje ovako", correct: !shouldSwap, explanation: !shouldSwap ? `Tačno! ${a} nije veće od ${b}, pa nema zamjene.` : `Nije tačno. ${a} je veće od ${b}, zato treba zamjena.` }
      ])
    });
  }

  if (selected === "selection") {
    const values = makeSmallArray(challengeRange.size, challengeRange.max);
    const correct = Math.min(...values);

    renderChallengeQuestion({
      algo: selected,
      title: "🔎 Pronađi minimum",
      skill: "Selection Sort stalno traži najmanji element u nesortiranom dijelu niza.",
      question: "Koji element bi Selection Sort sada izabrao kao minimum?",
      visual: `<div class="challenge-array">[${values.join(", ")}]</div>`,
      answers: shuffleArray([...new Set(values)].map(v => ({
        label: String(v),
        correct: v === correct,
        explanation: v === correct ? `Tačno! Najmanji element je ${correct}, zato ide na početak nesortiranog dijela.` : `Nije tačno. ${v} nije najmanji. Minimum je ${correct}.`
      })))
    });
  }

  if (selected === "insertion") {
    const sortedPart = makeSmallArray(challengeRange.size - 1, challengeRange.max).sort((a, b) => a - b);
    const value = randomInt(1, challengeRange.max);
    const correct = sortedPart.filter(x => x < value).length + 1;

    renderChallengeQuestion({
      algo: selected,
      title: "🃏 Ubaci element",
      skill: "Insertion Sort gradi sortirani dio kao karte u ruci i ubacuje novi broj na tačno mjesto.",
      question: `U sortirani dio <b>[${sortedPart.join(", ")}]</b> treba ubaciti broj <b>${value}</b>. Na koju poziciju ide?`,
      visual: `<div class="challenge-array insertion-visual">[${sortedPart.join(", ")}] + ${value}</div>`,
      answers: shuffleArray(Array.from({ length: sortedPart.length + 1 }, (_, i) => i + 1).map(pos => ({
        label: `Pozicija ${pos}`,
        correct: pos === correct,
        explanation: pos === correct ? `Tačno! Broj ${value} ide na poziciju ${correct}.` : `Nije tačno. Broj ${value} treba biti poslije svih manjih brojeva, dakle pozicija ${correct}.`
      })))
    });
  }

  if (selected === "merge") {
    const left = makeSmallArray(3, challengeRange.max).sort((a, b) => a - b);
    const right = makeSmallArray(3, challengeRange.max).sort((a, b) => a - b);
    const correct = Math.min(left[0], right[0]);

    renderChallengeQuestion({
      algo: selected,
      title: "🔗 Spoji podnizove",
      skill: "Merge Sort spaja dva sortirana podniza tako što uvijek uzima manji od dva početna elementa.",
      question: "Koji broj prvi ulazi u rezultat pri spajanju?",
      visual: `<div class="challenge-array merge-visual"><span>Lijevo: [${left.join(", ")}]</span><span>Desno: [${right.join(", ")}]</span></div>`,
      answers: shuffleArray([left[0], right[0], left[1]].map(v => ({
        label: String(v),
        correct: v === correct,
        explanation: v === correct ? `Tačno! Porede se ${left[0]} i ${right[0]}, a manji je ${correct}.` : `Nije tačno. Prvo se porede samo početni elementi ${left[0]} i ${right[0]}, pa ide ${correct}.`
      })))
    });
  }

  if (selected === "quick") {
    const pivot = randomInt(Math.max(3, Math.floor(challengeRange.max / 3)), Math.max(5, Math.floor(challengeRange.max * 0.75)));
    const values = makeSmallArray(challengeRange.size, challengeRange.max);
    const correct = values.filter(v => v < pivot).length;

    renderChallengeQuestion({
      algo: selected,
      title: "🎯 Razdvoji oko pivota",
      skill: "Quick Sort bira pivot, pa manje elemente šalje lijevo, a veće desno.",
      question: `Pivot je <b>${pivot}</b>. Koliko elemenata ide lijevo od pivota?`,
      visual: `<div class="challenge-array quick-visual"><span>Niz: [${values.join(", ")}]</span><span>Pivot: ${pivot}</span></div>`,
      answers: shuffleArray(Array.from({ length: values.length + 1 }, (_, i) => i).map(v => ({
        label: String(v),
        correct: v === correct,
        explanation: v === correct ? `Tačno! Lijevo idu svi elementi manji od ${pivot}; ima ih ${correct}.` : `Nije tačno. Prebroj samo brojeve manje od pivota ${pivot}; tačan broj je ${correct}.`
      })))
    });
  }
}

function checkChallengeAnswer(isCorrect, explanation) {
  const output = document.getElementById("challengeAnswer");
  if (!output) return;

  document.querySelectorAll("#challengeBox .challenge-answer-btn").forEach(btn => {
    btn.disabled = true;
    btn.classList.add("answer-disabled");
  });

  if (isCorrect) {
    challengeStreak++;
    localStorage.setItem("sortquest_challenge_streak", challengeStreak);

    playCorrectSound();
    setTutorState("happy");
    output.innerHTML = `
      <span class="result-good">✅ Tačno! ${explanation}</span>
      <button class="btn-secondary challenge-next-btn" onclick="startChallenge()">➡️ Sljedeći izazov</button>
    `;
    addLeaderboardPoints(10 + Math.min(challengeStreak * 2, 20));
    unlockAchievement("Challenge riješen");
  } else {
    challengeStreak = 0;
    localStorage.setItem("sortquest_challenge_streak", challengeStreak);

    playWrongSound();
    setTutorState("warning");
    output.innerHTML = `
      <span class="result-bad">❌ Nije tačno. ${explanation}</span>
      <button class="btn-secondary challenge-next-btn" onclick="startChallenge()">🔁 Probaj novi izazov</button>
    `;
  }
}

/* BATTLE */

function buildBattleArray(size, type) {
  let values = Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10);

  if (type === "nearly") {
    values = Array.from({ length: size }, (_, i) => 10 + i * 3);
    for (let k = 0; k < Math.max(1, Math.floor(size / 5)); k++) {
      const i = randomInt(0, size - 2);
      [values[i], values[i + 1]] = [values[i + 1], values[i]];
    }
  }

  if (type === "reversed") {
    values = Array.from({ length: size }, (_, i) => 10 + i * 3).reverse();
  }

  if (type === "duplicates") {
    const pool = [12, 18, 24, 30, 36];
    values = Array.from({ length: size }, () => pool[randomInt(0, pool.length - 1)]);
  }

  return values;
}

function summarizeSteps(stepList) {
  return {
    total: stepList.length,
    comparisons: stepList.filter(step => step.type === "compare").length,
    swaps: stepList.filter(step => step.type === "swap").length,
    writes: stepList.filter(step => step.type === "overwrite").length,
    pivots: stepList.filter(step => step.type === "pivot").length,
    splits: stepList.filter(step => step.type === "split").length
  };
}

function getInputTypeName(type) {
  const names = {
    random: "nasumičan niz",
    nearly: "skoro sortiran niz",
    reversed: "obrnuto sortiran niz",
    duplicates: "niz sa mnogo duplikata"
  };

  return names[type] || "nasumičan niz";
}

function getBattleLesson(algo1, algo2, summary1, summary2, inputType) {
  const winnerSummary = summary1.total <= summary2.total ? summary1 : summary2;
  const loserSummary = summary1.total <= summary2.total ? summary2 : summary1;
  const winnerAlgo = summary1.total <= summary2.total ? algo1 : algo2;

  if (summary1.total === summary2.total) {
    return "Oba algoritma su imala isti broj koraka na ovom nizu. Promijeni tip ulaza da vidiš kada se razlika bolje pojavi.";
  }

  if (winnerAlgo === "insertion" && inputType === "nearly") {
    return "Pouka: Insertion Sort često blista na skoro sortiranim nizovima, jer mora napraviti malo pomjeranja.";
  }

  if (["merge", "quick"].includes(winnerAlgo) && loserSummary.total > winnerSummary.total) {
    return "Pouka: algoritmi tipa divide-and-conquer često koriste manje koraka na većim ili neurednim nizovima.";
  }

  if (["bubble", "selection"].includes(winnerAlgo)) {
    return "Pouka: na malim nizovima jednostavni algoritmi ponekad izgledaju konkurentno, ali probaj veći niz da vidiš razliku.";
  }

  if (inputType === "reversed") {
    return "Pouka: obrnuto sortiran niz je težak slučaj za jednostavne algoritme jer izaziva mnogo zamjena ili poređenja.";
  }

  return "Pouka: ne postoji uvijek jedan najbolji algoritam. Brzina zavisi od veličine niza, tipa ulaza i broja poređenja/zamjena.";
}

function startBattle() {
  playClickSound();

  const algo1 = document.getElementById("battleAlgo1").value;
  const algo2 = document.getElementById("battleAlgo2").value;
  const size = Number(document.getElementById("battleSize")?.value || 10);
  const inputType = document.getElementById("battleInputType")?.value || "random";

  const battleArray = buildBattleArray(size, inputType);

  const steps1 = getStepsForAlgorithm(algo1, [...battleArray]);
  const steps2 = getStepsForAlgorithm(algo2, [...battleArray]);
  const summary1 = summarizeSteps(steps1);
  const summary2 = summarizeSteps(steps2);

  let winner = "Neriješeno";
  let winnerEmoji = "🤝";

  if (summary1.total < summary2.total) {
    winner = getAlgorithmName(algo1);
    winnerEmoji = "🥇";
  }

  if (summary2.total < summary1.total) {
    winner = getAlgorithmName(algo2);
    winnerEmoji = "🥇";
  }

  const resultBox = document.getElementById("battleResult");

  if (!resultBox) return;

  const algoColor1 = summary1.total < summary2.total ? "#22c55e" : summary1.total === summary2.total ? "#facc15" : "#64748b";
  const algoColor2 = summary2.total < summary1.total ? "#22c55e" : summary1.total === summary2.total ? "#facc15" : "#64748b";
  const lesson = getBattleLesson(algo1, algo2, summary1, summary2, inputType);

  resultBox.innerHTML = `
    <div class="battle-result compact-battle-result smart-battle-result">
      <div class="battle-result-topline">
        <h3>⚔️ Rezultat borbe</h3>
        <span class="battle-winner-pill">${winnerEmoji} ${winner}</span>
      </div>

      <div class="battle-meta-row">
        <span><b>Tip ulaza:</b> ${getInputTypeName(inputType)}</span>
        <span><b>Veličina:</b> ${size} elemenata</span>
      </div>

      <div class="battle-array-pill"><b>Niz:</b> [${battleArray.join(", ")}]</div>
      
      <div class="battle-comparison compact-battle-comparison smart-battle-comparison">
        ${renderBattleScoreCard("Algoritam 1", algo1, summary1, algoColor1)}
        <div class="battle-vs-compact big-vs">VS</div>
        ${renderBattleScoreCard("Algoritam 2", algo2, summary2, algoColor2)}
      </div>

      <div class="battle-lesson-box">
        <strong>🧠 Šta treba naučiti?</strong>
        <span>${lesson}</span>
      </div>
    </div>
  `;

  playSuccessSound();

  addLeaderboardPoints(25);
  unlockAchievement("Pokrenut Algorithm Battle");
}

function renderBattleScoreCard(label, algo, summary, color) {
  return `
    <div class="battle-score-card smart-battle-score-card" style="--battle-color: ${color};">
      <span class="battle-card-label">${label}</span>
      <strong>${getAlgorithmName(algo)}</strong>
      <span class="battle-steps">${summary.total}</span>
      <small>ukupno koraka</small>
      <div class="battle-mini-stats">
        <span>🔍 ${summary.comparisons} poređenja</span>
        <span>🔄 ${summary.swaps} zamjena</span>
        ${summary.writes ? `<span>✏️ ${summary.writes} upisa</span>` : ""}
      </div>
    </div>
  `;
}

function getStepsForAlgorithm(algo, arr) {
  if (algo === "bubble") return bubbleSortSteps(arr);
  if (algo === "selection") return selectionSortSteps(arr);
  if (algo === "insertion") return insertionSortSteps(arr);
  if (algo === "merge") return mergeSortSteps(arr);
  if (algo === "quick") return quickSortSteps(arr);

  return [];
}

function getAlgorithmName(algo) {
  return algorithmData[algo]?.name || algo;
}

/* KVIZ */

const quizQuestions = {
  bubble: [
    {
      question: "Koji algoritam stalno poredi susjedne elemente?",
      answers: ["Bubble Sort", "Merge Sort", "Quick Sort"],
      correct: "Bubble Sort"
    },
    {
      question: "Šta se dešava ako je lijevi element veći od desnog?",
      answers: ["Elementi se zamijene", "Niz se dijeli", "Bira se pivot"],
      correct: "Elementi se zamijene"
    },
    {
      question: "Gdje veći elementi obično odlaze kod Bubble Sorta?",
      answers: ["Ka kraju niza", "Uvijek na početak", "U poseban niz"],
      correct: "Ka kraju niza"
    }
  ],
  selection: [
    {
      question: "Šta Selection Sort traži u svakom prolazu?",
      answers: ["Najmanji element", "Pivot", "Sredinu niza"],
      correct: "Najmanji element"
    },
    {
      question: "Kada Selection Sort pronađe minimum, šta radi?",
      answers: ["Mijenja ga sa početkom nesortiranog dijela", "Briše ga", "Dijeli niz"],
      correct: "Mijenja ga sa početkom nesortiranog dijela"
    },
    {
      question: "Kakva je prosječna složenost Selection Sorta?",
      answers: ["O(n²)", "O(log n)", "O(1)"],
      correct: "O(n²)"
    }
  ],
  insertion: [
    {
      question: "Na šta najviše liči Insertion Sort?",
      answers: ["Slaganje karata u ruci", "Dijeljenje niza", "Biranje pivota"],
      correct: "Slaganje karata u ruci"
    },
    {
      question: "Kakav ulaz Insertion Sort posebno dobro sortira?",
      answers: ["Skoro sortiran niz", "Potpuno nasumičan veliki niz", "Samo prazan niz"],
      correct: "Skoro sortiran niz"
    },
    {
      question: "Šta radi sa trenutnim elementom?",
      answers: ["Ubacuje ga na pravo mjesto lijevo", "Uvijek ga šalje na kraj", "Pretvara ga u pivot"],
      correct: "Ubacuje ga na pravo mjesto lijevo"
    }
  ],
  merge: [
    {
      question: "Koji princip koristi Merge Sort?",
      answers: ["Podijeli pa vladaj", "Samo zamjene susjeda", "Traženje minimuma"],
      correct: "Podijeli pa vladaj"
    },
    {
      question: "Šta Merge Sort radi nakon dijeljenja?",
      answers: ["Spaja sortirane dijelove", "Bira pivot", "Staje odmah"],
      correct: "Spaja sortirane dijelove"
    },
    {
      question: "Koja je tipična složenost Merge Sorta?",
      answers: ["O(n log n)", "O(n²)", "O(1)"],
      correct: "O(n log n)"
    }
  ],
  quick: [
    {
      question: "Šta Quick Sort bira za podjelu niza?",
      answers: ["Pivot", "Najmanji element", "Zadnji sortirani dio"],
      correct: "Pivot"
    },
    {
      question: "Gdje idu elementi manji od pivota?",
      answers: ["Lijevo", "Desno", "Brišu se"],
      correct: "Lijevo"
    },
    {
      question: "Kada Quick Sort može biti spor?",
      answers: ["Kada je pivot loše izabran", "Kada ima samo jedan element", "Kada nema brojeva"],
      correct: "Kada je pivot loše izabran"
    }
  ]
};

function pickQuizQuestion(algo) {
  const questions = quizQuestions[algo] || quizQuestions.bubble;
  return questions[Math.floor(Math.random() * questions.length)];
}

function escapeForOnclick(text) {
  return String(text).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
}

function showQuiz() {
  const selected = document.getElementById("algorithmSelect").value;
  const quiz = pickQuizQuestion(selected);
  const quizBox = document.getElementById("quizBox");

  if (!quizBox || !quiz) return;

  quizBox.innerHTML = `
    <div class="quiz-content">
      <h3>📝 ${getAlgorithmName(selected)} kviz</h3>
      <p style="font-size: 18px; margin: 20px 0;">${quiz.question}</p>
      <div class="quiz-buttons">
        ${quiz.answers.map(answer => `
          <button class="quiz-answer" onclick="checkQuizAnswer('${escapeForOnclick(answer)}', '${escapeForOnclick(quiz.correct)}')">${answer}</button>
        `).join("")}
      </div>
      <p id="quizFeedback"></p>
    </div>
  `;

  addHoverSounds();
}

function checkQuizAnswer(answer, correct) {
  const feedback = document.getElementById("quizFeedback");

  if (!feedback) return;

  if (answer === correct) {
    playCorrectSound();
    setTutorState("happy");

    document.querySelectorAll("#quizBox .quiz-answer").forEach(btn => {
      btn.disabled = true;
      btn.classList.add("answer-disabled");
    });

    feedback.innerHTML = `<span class="result-good">✅ Tačno! Osvojio/la si 50 poena. Vraćam te na Learn za nastavak učenja...</span>`;

    addLeaderboardPoints(50);
    unlockAchievement("Kviz majstor");

    setTimeout(() => {
      showScreen("learn");
      setTutorState("happy");
      if (tutorMessage) {
        tutorMessage.textContent = "✅ Odlično! Kviz je riješen. Nastavi sa animacijom, promijeni algoritam ili probaj novi niz.";
      }
    }, 1400);
  } else {
    playWrongSound();
    setTutorState("warning");

    feedback.innerHTML = `<span class="result-bad">❌ Nije tačno. Pokušaj ponovo.</span>`;
  }
}

/* SCORE */

const starterAchievements = ["Početnik", "Prvi korak"];

function ensureStarterProgress() {
  const savedScore = Number(localStorage.getItem("sortquest_score") || 0);
  if (!localStorage.getItem("sortquest_score") || savedScore <= 0) {
    localStorage.setItem("sortquest_score", "100");
  }

  const achievements = JSON.parse(localStorage.getItem("sortquest_achievements") || "[]");
  let changed = false;
  starterAchievements.forEach(item => {
    if (!achievements.includes(item)) {
      achievements.push(item);
      changed = true;
    }
  });

  if (changed) {
    localStorage.setItem("sortquest_achievements", JSON.stringify(achievements));
  }

  score = Number(localStorage.getItem("sortquest_score") || 100);
}

function resetToStarterProgress() {
  localStorage.setItem("sortquest_score", "100");
  localStorage.setItem("sortquest_achievements", JSON.stringify(starterAchievements));
  localStorage.removeItem("sortquest_completed_algorithms");
  score = 100;
}

function saveScore() {
  const gained = Math.max(1000 - steps.length * 5, 100);

  addLeaderboardPoints(gained);
}

function addLeaderboardPoints(points) {
  score += points;

  localStorage.setItem("sortquest_score", score);

  playClickSound();
  updateStats();
}

function unlockAchievement(name) {
  const achievements = JSON.parse(localStorage.getItem("sortquest_achievements") || "[]");

  if (!achievements.includes(name)) {
    achievements.push(name);

    localStorage.setItem("sortquest_achievements", JSON.stringify(achievements));

    playSuccessSound();
  }
}

function showLeaderboard() {
  const currentScore = Number(localStorage.getItem("sortquest_score") || 0);
  const achievements = JSON.parse(localStorage.getItem("sortquest_achievements") || "[]");

  const leaderboardList = document.getElementById("leaderboardList");

  if (!leaderboardList) return;

  leaderboardList.innerHTML = `
    <div class="leaderboard-content compact-leaderboard-content">
      <div class="score-card compact-score-card">
        <div>
          <h3>🏆 Tvoj rezultat</h3>
          <p>Ukupno poena</p>
        </div>
        <strong>${currentScore}</strong>
      </div>

      <div class="leaderboard-section-title">
        <h3>🎖️ Dostignuća</h3>
        <span>${achievements.length} otključano</span>
      </div>

      <div class="achievements-list compact-achievements-list">
        ${
          achievements.length === 0
            ? "<p class=\"empty-achievements\">Još nema otključanih dostignuća. Nastavi sa igranjem!</p>"
            : achievements.map(a => {
                const img = a === "Kviz majstor"
                  ? "assets/images/quiz-master-badge.png"
                  : a === "Challenge riješen"
                  ? "assets/images/challenge-badge.png"
                  : a === "Početnik"
                  ? "assets/images/app-icon.png"
                  : "assets/images/first-sort-badge.png";

                return `
                  <div class="achievement-item compact-achievement-item">
                    <img src="${img}" alt="${a}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2245%22 fill=%22%23facc15%22/><text x=%2250%22 y=%2260%22 text-anchor=%22middle%22 font-size=%2240%22>🏆</text></svg>'">
                    <span>${a}</span>
                  </div>
                `;
              }).join("")
        }
      </div>
    </div>
  `;
}

function clearProgress() {
  if (confirm("⚠️ Da li želiš resetovati rezultate na početni profil?")) {
    resetToStarterProgress();

    updateStats();
    updateLearningPath();
    showLeaderboard();
    
    playCorrectSound();
    alert("✅ Rezultati su resetovani. Početni rezultat i osnovna dostignuća su vraćeni!");
  }
}

/* SETTINGS */

function updateSoundUi() {
  const btn = document.getElementById("soundToggleBtn");
  const soundSelect = document.getElementById("soundSelect");

  if (btn) {
    btn.textContent = soundEnabled ? "🔊" : "🔇";
    btn.classList.toggle("sound-off", !soundEnabled);
  }

  if (soundSelect) {
    soundSelect.value = soundEnabled ? "on" : "off";
  }
}

function changeSound() {
  const soundSelect = document.getElementById("soundSelect");

  soundEnabled = soundSelect.value === "on";
  localStorage.setItem("sortquest_sound", soundEnabled ? "on" : "off");
  updateSoundUi();

  if (!soundEnabled) {
    stopAllMusic();
  } else {
    unlockAudio().then(() => {
      playClickSound();
      playMusic("backgroundMusic");
    });
  }
}

function changeTheme() {
  const value = document.getElementById("themeSelect").value;

  if (value === "light") {
    document.body.classList.add("light-theme");
    localStorage.setItem("sortquest_theme", "light");
  } else {
    document.body.classList.remove("light-theme");
    localStorage.setItem("sortquest_theme", "dark");
  }
}


/* HOVER */

function addHoverSounds() {
  document.querySelectorAll("button").forEach(button => {
    if (!button.dataset.hoverAdded) {
      button.addEventListener("mouseenter", () => {
        playHintSound();
      });

      button.dataset.hoverAdded = "true";
    }
  });
}

/* INIT */

// Učitaj sprašene postavke
const savedTheme = localStorage.getItem("sortquest_theme");
if (savedTheme === "light") {
  document.body.classList.add("light-theme");
  const themeSelect = document.getElementById("themeSelect");
  if (themeSelect) themeSelect.value = "light";
}

const savedSpeed = localStorage.getItem("sortquest_speed");
if (savedSpeed) {
  animationSpeed = Number(savedSpeed);
  const speedSelect = document.getElementById("speedSelect");
  if (speedSelect) speedSelect.value = savedSpeed;
}

ensureStarterProgress();
updateSoundUi();

newArray();
algorithmChanged();
updateLearningPath();
updateStats();
updateProgress();
addHoverSounds();

// Browseri ne dozvoljavaju zvuk dok korisnik prvi put ne klikne/tapne stranicu.
// Zato se audio kontekst otključava na pointerdown, prije onclick akcija dugmadi.
document.addEventListener("pointerdown", () => {
  unlockAudio().then(() => {
    if (soundEnabled) {
      const activeScreen = document.querySelector(".screen.active");

      if (activeScreen) {
        if (activeScreen.id === "challenge") {
          playMusic("challengeMusic");
        } else if (activeScreen.id === "battle") {
          playMusic("battleMusic");
        } else if (activeScreen.id === "quiz") {
          playMusic("quizMusic");
        } else {
          playMusic("backgroundMusic");
        }
      }
    }
  });
}, { once: true, capture: true });

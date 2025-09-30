function decodeHTML(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }

  const username = localStorage.getItem('username') || 'Player';
  const emoji = localStorage.getItem('emoji') || '😀';
  const quizCategory = localStorage.getItem('quizCategory');
  const quizTypeName = localStorage.getItem('quizType') || 'General';
  const difficultyValue = parseInt(localStorage.getItem('difficulty')) || 5;
  const numQuestions = parseInt(localStorage.getItem('numQuestions')) || 10;

  let timeLeft = numQuestions * 20;
  let timerInterval = null;

  let quizQuestions = [];
  let currentQuestion = 0;
  let userAnswers = [];

  const loadingBox = document.getElementById('loadingBox');
  const quizBox = document.getElementById('quizContainer');
  const userInfoEl = document.getElementById('userInfo');
  const timerEl = document.getElementById('timer');
  const questionNumberEl = document.getElementById('questionNumber');
  const questionTextEl = document.getElementById('questionText');
  const optionsContainer = document.getElementById('optionsContainer');
  const progressText = document.getElementById('progressText');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  function mapDifficulty(val) {
    if (val <= 3) return 'easy';
    if (val <= 7) return 'medium';
    return 'hard';
  }

  function buildApiUrl() {
    const params = new URLSearchParams();
    params.set('amount', numQuestions);
    params.set('difficulty', mapDifficulty(difficultyValue));
    params.set('type', 'multiple');
    const parsedCat = parseInt(quizCategory);
    if (!isNaN(parsedCat)) params.set('category', parsedCat);
    return `https://opentdb.com/api.php?${params.toString()}`;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  async function loadQuiz() {
    const url = buildApiUrl();
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!data || data.response_code !== 0 || !Array.isArray(data.results) || data.results.length === 0) {
        quizQuestions = [{
          question: 'No questions available. Try different settings.',
          options: ['OK'],
          answer: 'OK'
        }];
      } else {
        quizQuestions = data.results.map(q => {
          const opts = shuffle([q.correct_answer, ...q.incorrect_answers]);
          return { question: q.question, options: opts, answer: q.correct_answer };
        });
      }
    } catch (err) {
      quizQuestions = [{
        question: 'Could not fetch questions (network error).',
        options: ['OK'],
        answer: 'OK'
      }];
    }

    loadingBox.style.display = 'none';
    quizBox.style.display = 'block';
    userInfoEl.innerHTML = `${emoji} <strong>${decodeHTML(username)}</strong> · ${decodeHTML(quizTypeName)} · ${quizQuestions.length} Questions`;
    startTimer();
    loadQuestion();
  }

  function startTimer() {
    updateTimerDisplay();
    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        showResult();
      }
    }, 1000);
  }
  function updateTimerDisplay() {
    const mins = Math.floor(Math.max(0, timeLeft) / 60);
    const secs = Math.max(0, timeLeft) % 60;
    timerEl.textContent = `Time Left: ${mins}:${secs < 10 ? '0' : ''}${secs}`;
    if (timeLeft <= 10) timerEl.style.color = 'red';
  }

  function loadQuestion() {
    const q = quizQuestions[currentQuestion];
    questionNumberEl.textContent = `Q ${currentQuestion + 1} of ${quizQuestions.length}`;
    questionTextEl.textContent = decodeHTML(q.question);
    optionsContainer.innerHTML = '';

    q.options.forEach(optRaw => {
      const optionText = decodeHTML(optRaw);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.innerText = optionText;

      btn.onclick = () => {
        if (userAnswers[currentQuestion] !== undefined) return;
        userAnswers[currentQuestion] = optRaw;
        if (optRaw === q.answer) {
          btn.classList.add('correct');
        } else {
          btn.classList.add('wrong');
          optionsContainer.querySelectorAll('button').forEach(b => {
            if (b.innerText === decodeHTML(q.answer)) {
              b.classList.add('correct');
            }
          });
        }
        optionsContainer.querySelectorAll('button').forEach(b => b.disabled = true);
      };

      if (userAnswers[currentQuestion] !== undefined) {
        btn.disabled = true;
        if (userAnswers[currentQuestion] === optRaw && optRaw === q.answer) {
          btn.classList.add('correct');
        } else if (userAnswers[currentQuestion] === optRaw && optRaw !== q.answer) {
          btn.classList.add('wrong');
        }
        if (optRaw === q.answer) {
          btn.classList.add('correct');
        }
      }
      optionsContainer.appendChild(btn);
    });

    prevBtn.style.visibility = currentQuestion === 0 ? 'hidden' : 'visible';
    nextBtn.innerText = currentQuestion === quizQuestions.length - 1 ? 'Submit' : 'Next';
    progressText.textContent = `Progress: ${currentQuestion + 1} of ${quizQuestions.length}`;
  }

  function nextQuestion() {
    if (currentQuestion < quizQuestions.length - 1) {
      currentQuestion++;
      loadQuestion();
    } else {
      showResult();
    }
  }

  function prevQuestion() {
    if (currentQuestion > 0) {
      currentQuestion--;
      loadQuestion();
    }
  }

  function showResult() {
    clearInterval(timerInterval);

    let attempted = 0, correct = 0;
    quizQuestions.forEach((q, i) => {
      if (userAnswers[i] !== undefined) attempted++;
      if (userAnswers[i] === q.answer) correct++;
    });
    const wrong = attempted - correct;
    const notAttempted = quizQuestions.length - attempted;

    quizBox.innerHTML = `
      <h2 style="color:#6a5acd;margin:0;text-align:center"> ${decodeHTML(username)}, Your Score: ${correct} / ${quizQuestions.length}</h2>
      <div class="stats">Attempted: ${attempted} | Correct: ${correct} | Incorrect: ${wrong} | Not Answered: ${notAttempted}</div>
      <div class="chart-wrapper"><canvas id="resultChart"></canvas></div>
      <div class="result-container"></div>
      <button class="play-again-btn" onclick="location.href='setup.html'">Play Again</button>
    `;

    const ctx = document.getElementById('resultChart').getContext('2d');
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Correct', 'Incorrect', 'Not Answered'],
        datasets: [{
          data: [correct, wrong, notAttempted],
          backgroundColor: ['#4CAF50', '#f44336', '#9e9e9e'],
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { position: 'bottom' } }
      }
    });

    const resultDiv = quizBox.querySelector('.result-container');
    quizQuestions.forEach((q, i) => {
      const userAns = userAnswers[i];
      let userClass = '';
      let userDisplay = '';

      if (userAns === undefined) {
        userClass = 'not-answered';
        userDisplay = 'No Answer';
      } else if (userAns === q.answer) {
        userClass = 'correct';
        userDisplay = decodeHTML(userAns);
      } else {
        userClass = 'wrong';
        userDisplay = decodeHTML(userAns);
      }

      const block = document.createElement('div');
      block.className = 'result-block';
      block.innerHTML = `
        <div style="font-weight:700;color:#6a5acd">Q${i+1}: ${decodeHTML(q.question)}</div>
        <div>Your Answer: <strong class="${userClass}">${userDisplay}</strong></div>
        <div>Correct Answer: <strong class="correct">${decodeHTML(q.answer)}</strong></div>
      `;
      resultDiv.appendChild(block);
    });
  }

  loadQuiz();

 const slider = document.getElementById('difficulty');
    const diffValue = document.getElementById('diffValue');
    slider.addEventListener('input', () => diffValue.textContent = slider.value);

    let selectedEmoji = '';
    function selectEmoji(el) {
      document.querySelectorAll('.emoji-container span').forEach(s => s.classList.remove('selected'));
      el.classList.add('selected');
      selectedEmoji = el.textContent;
    }

    function startQuiz() {
      const name = document.getElementById('username').value.trim();
      const sel = document.getElementById('quizType');
      const categoryId = sel.value;                   // numeric category id string
      const categoryName = sel.options[sel.selectedIndex]?.text || '';
      const difficulty = document.getElementById('difficulty').value;
      const numQuestions = document.getElementById('numQuestions').value;

      if (!name || !categoryId || !difficulty || !selectedEmoji) {
        alert('Please fill all fields and pick an emoji.');
        return;
      }

      // Save both the numeric category and a friendly name
      localStorage.setItem('username', name);
      localStorage.setItem('quizCategory', categoryId);   // used for API (e.g. "9")
      localStorage.setItem('quizType', categoryName);     // friendly display (e.g. "General Knowledge")
      localStorage.setItem('difficulty', difficulty);
      localStorage.setItem('numQuestions', numQuestions);
      localStorage.setItem('emoji', selectedEmoji);

      window.location.href = 'quiz.html';
    }
  
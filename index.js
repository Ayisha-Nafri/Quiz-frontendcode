// Show start button after 4 seconds
    setTimeout(() => {
      document.getElementById("loader").style.display = "none";
      const btn = document.getElementById("startBtn");
      btn.classList.add("show");
    }, 4000);

    function goToQuiz() {
      window.location.href = "setup.html"; // redirect to setup page
    }



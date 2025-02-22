// public/scripts/main.js

function showSection(sectionId) {
    document.querySelectorAll('section').forEach((section) => {
      section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
  }
  
  function publishReel() {
    // Trigger the backend to generate and publish the reel
    fetch('/reel/publish', { method: 'POST' })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message); // Notify the user that the reel generation is in progress
        showSection('scriptReview'); // Move to script review
        document.getElementById('scriptContent').textContent = data.script; // Load the script
      })
      .catch((error) => {
        console.error('Error publishing reel:', error);
      });
  }
  
  function acceptScript() {
    const script = document.getElementById('scriptContent').textContent;
  
    fetch('/reel/accept-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script })
    })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message);
        showSection('videoReview'); // Move to video review
      })
      .catch((error) => {
        console.error('Error accepting script:', error);
      });
  }
  
  function regenerateScript() {
    fetch('/reel/regenerate-script', { method: 'POST' })
      .then((response) => response.json())
      .then((data) => {
        document.getElementById('scriptContent').textContent = data.script;
        alert(data.message);
      })
      .catch((error) => {
        console.error('Error regenerating script:', error);
      });
  }
  
  function acceptVideo() {
    const videoId = document.getElementById('videoPlayer').getAttribute('data-id');
  
    fetch('/reel/accept-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId })
    })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message);
        alert("Reel successfully published!");
      })
      .catch((error) => {
        console.error('Error accepting video:', error);
      });
  }
  
  function regenerateVideo() {
    fetch('/reel/regenerate-video', { method: 'POST' })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message);
        const videoPlayer = document.getElementById('videoPlayer');
        videoPlayer.style.display = 'none'; // Hide previous video
        document.getElementById('videoPlaceholder').style.display = 'block'; // Show the placeholder
      })
      .catch((error) => {
        console.error('Error regenerating video:', error);
      });
  }
  
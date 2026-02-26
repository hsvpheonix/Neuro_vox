// Chat functionality
const chatContainer = document.getElementById('chatContainer');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const suggestionBtns = document.querySelectorAll('.suggestion-btn');
const stopTalkingBtn = document.getElementById('stopTalkingBtn');
const chatLangSelect = document.getElementById('chatLangSelect');

let synth = window.speechSynthesis;

function addMessage(message, isUser = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
  messageDiv.innerHTML = `<div class="message-content">${message}</div>`;
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function getResponse(message, lang = 'en') {
  const responses = {
    en: {
      "hello": "Hello! How can I help you today?",
      "how are you": "I'm doing well, thank you! How about you?",
      "what is neurovox": "NeuroVox is an innovative platform that uses brain signals to help people communicate. It translates thoughts into speech and text.",
      "how does it work": "NeuroVox uses advanced EEG technology to detect brain signals and convert them into understandable language.",
      "tell me about the team": "Our team consists of experts in neuroscience, AI, and software development working together to make communication accessible.",
      "what are the features": "Key features include real-time speech synthesis, customizable interfaces, and integration with various assistive devices.",
      "what is the cerebellum": "The cerebellum is the part of the brain that controls coordination and balance.",
      "what is the frontal lobe": "The frontal lobe is responsible for decision-making, problem-solving, and controlling behavior.",
      "what is alzheimer's": "Alzheimer's disease is a progressive disorder that causes memory loss and cognitive decline.",
      "what are neurons": "Neurons are nerve cells that transmit information in the brain and nervous system.",
      "what is the amygdala": "The amygdala is involved in processing emotions, especially fear and aggression.",
      "what is the hippocampus": "The hippocampus is crucial for forming and retrieving memories.",
      "what is parkinson's": "Parkinson's disease is a movement disorder that affects the nervous system.",
      "what is epilepsy": "Epilepsy is a neurological disorder characterized by recurrent seizures.",
      "how to improve brain health": "To improve brain health, exercise regularly, eat a balanced diet, get enough sleep, and engage in mental activities.",
      "what is the blood-brain barrier": "The blood-brain barrier is a protective barrier that controls what substances enter the brain from the bloodstream.",
      "default": "I'm sorry, I didn't understand that. Can you please rephrase your question?"
    },
    hi: {
      "hello": "नमस्ते! आज आपकी कैसे मदद कर सकता हूँ?",
      "how are you": "मैं ठीक हूँ, धन्यवाद! आप कैसे हैं?",
      "what is neurovox": "न्यूरोवॉक्स एक अभिनव प्लेटफॉर्म है जो लोगों को संवाद करने में मदद करने के लिए ब्रेन सिग्नल का उपयोग करता है। यह विचारों को भाषण और पाठ में अनुवाद करता है।",
      "how does it work": "न्यूरोवॉक्स उन्नत ईईजी तकनीक का उपयोग करता है ताकि ब्रेन सिग्नल का पता लगाया जा सके और उन्हें समझने योग्य भाषा में परिवर्तित किया जा सके।",
      "tell me about the team": "हमारी टीम न्यूरोसाइंस, एआई, और सॉफ्टवेयर डेवलपमेंट के विशेषज्ञों से मिलकर बनी है जो संवाद को सुलभ बनाने के लिए साथ मिलकर काम करती है।",
      "what are the features": "मुख्य विशेषताओं में रीयल-टाइम स्पीच सिंथेसिस, कस्टमाइजेबल इंटरफेस, और विभिन्न सहायक उपकरणों के साथ एकीकरण शामिल हैं।",
      "what is the cerebellum": "सेरेबेलम मस्तिष्क का वह भाग है जो समन्वय और संतुलन को नियंत्रित करता है।",
      "what is the frontal lobe": "फ्रंटल लोब निर्णय लेने, समस्या हल करने और व्यवहार को नियंत्रित करने के लिए जिम्मेदार है।",
      "what is alzheimer's": "अल्जाइमर रोग एक प्रगतिशील विकार है जो स्मृति हानि और संज्ञानात्मक गिरावट का कारण बनता है।",
      "what are neurons": "न्यूरॉन्स तंत्रिका कोशिकाएं हैं जो मस्तिष्क और तंत्रिका तंत्र में जानकारी प्रसारित करती हैं।",
      "what is the amygdala": "एमिग्डाला भावनाओं, विशेष रूप से भय और आक्रामकता को संसाधित करने में शामिल है।",
      "what is the hippocampus": "हिप्पोकैंपस स्मृतियों को बनाने और पुनः प्राप्त करने के लिए महत्वपूर्ण है।",
      "what is parkinson's": "पार्किंसंस रोग एक गति विकार है जो तंत्रिका तंत्र को प्रभावित करता है।",
      "what is epilepsy": "एपिलेप्सी एक न्यूरोलॉजिकल विकार है जिसे आवर्ती दौरों द्वारा विशेषता है।",
      "how to improve brain health": "मस्तिष्क स्वास्थ्य में सुधार के लिए, नियमित व्यायाम करें, संतुलित आहार लें, पर्याप्त नींद लें, और मानसिक गतिविधियों में संलग्न हों।",
      "what is the blood-brain barrier": "ब्लड-ब्रेन बैरियर एक सुरक्षात्मक बैरियर है जो नियंत्रित करता है कि रक्तप्रवाह से मस्तिष्क में कौन सी पदार्थ प्रवेश करती हैं।",
      "default": "मुझे खेद है, मुझे यह समझ नहीं आया। कृपया अपना प्रश्न फिर से कहें।"
    }
  };
  const lowerMessage = message.toLowerCase();
  const langResponses = responses[lang] || responses['en'];
  for (let key in langResponses) {
    if (lowerMessage.includes(key)) {
      return langResponses[key];
    }
  }
  return langResponses["default"];
}

function speakText(text, lang = 'en') {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 0.8;
    utterance.pitch = 1;
    synth.speak(utterance);
  } else if (responsiveVoice) {
    responsiveVoice.speak(text, lang === 'en' ? 'UK English Female' : lang === 'hi' ? 'Hindi Female' : 'US English Female');
  }
}

sendBtn.addEventListener('click', () => {
  const message = chatInput.value.trim();
  if (message) {
    addMessage(message, true);
    chatInput.value = '';
    const lang = chatLangSelect.value;
    setTimeout(() => {
      const response = getResponse(message, lang);
      addMessage(response);
      speakText(response, lang);
    }, 1000);
  }
});

chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendBtn.click();
  }
});

suggestionBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const question = btn.getAttribute('data-question');
    chatInput.value = question;
    sendBtn.click();
  });
});

stopTalkingBtn.addEventListener('click', () => {
  synth.cancel();
  responsiveVoice.cancel();
});

// Show login success message if redirected with success
if (window.location.search.includes('login=success')) {
  document.getElementById('loginSuccessMessage').classList.remove('hidden');
}

// Modal functionality for Live Dashboard
function openLiveDashboardModal() {
  document.getElementById('liveDashboardModal').classList.remove('hidden');
}

function closeLiveDashboardModal() {
  document.getElementById('liveDashboardModal').classList.add('hidden');
}

// Event listeners for modal buttons
document.getElementById('btnLiveDashboardModal').addEventListener('click', () => {
  document.getElementById('liveDashboardSectionModal').classList.remove('hidden');
  document.getElementById('exploreFeatureSectionModal').classList.add('hidden');
});

document.getElementById('btnExploreFeatureModal').addEventListener('click', () => {
  document.getElementById('liveDashboardSectionModal').classList.add('hidden');
  document.getElementById('exploreFeatureSectionModal').classList.remove('hidden');
  // Initialize chart
  const ctx = document.getElementById('brainActivityChartExploreModal').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00'],
      datasets: [{
        label: 'Brain Activity',
        data: [65, 59, 80, 81, 56, 55, 40],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Brain Activity Trends'
        }
      }
    }
  });
});

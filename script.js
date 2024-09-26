'use strict';

const selectSymptomsElement = document.getElementById('symptom-selection');
const symptomSubmitButton = document.getElementById('symptom-submit-button');
const symptomSubmitForm = document.getElementById('symptom-submit-form');
const symptomSelection = document.getElementById('symptom-selection');
const diagnosesContainer = document.getElementById('diagnoses-container');
const yourSymptomsContainer = document.getElementById('your-symptoms');
const addSymptomsButton = document.getElementById('add-symptom');
const selectYear = document.getElementById('select-year');
const symptomsForm = document.getElementById('symptoms-form');
const specialistsElement = document.getElementById('specialists-container');

let token = '';
let authenticationUrl = 'https://sandbox-authservice.priaid.ch';
let dataUrl = 'https://sandbox-healthservice.priaid.ch';

let symptomsArray = [];
let diagnosesArray = [];
let selectedSymptomID = -1;
let selectedSymptomName = '';
let selectedSymptoms = [];
let chosenSymptomNames = [];
let sex = '';
let birthyear = -1;
let specializationsOpen = false;

function yearSelection() {
  const todaysDate = new Date();
  for (let i = todaysDate.getFullYear(); i >= 1900; i--) {
    const yearOption = document.createElement('option');
    yearOption.setAttribute('value', i);
    yearOption.textContent = i;
    selectYear.appendChild(yearOption);
  }
}

function populateSymptoms() {
  // Populate the selection of symptom options in the form
  symptomsArray.forEach((symptom, index) => {
    const symptomOption = document.createElement('option');
    symptomOption.textContent = symptom.Name;
    symptomOption.setAttribute('value', symptom.ID);

    // Set the first option as selected
    if (index === 0) {
      symptomOption.setAttribute('selected', true);
    }

    selectSymptomsElement.appendChild(symptomOption);
  });
}

async function getSymptoms() {
  try {
    // Create an encrypted hash string for API authentication
    const uri = `${authenticationUrl}/login`;
    const secretKey = 'Er5j4ZDe87NdXp63Q';
    const computedHash = CryptoJS.HmacMD5(uri, secretKey);
    const computedHashString = computedHash.toString(CryptoJS.enc.Base64);
    console.log(computedHashString);

    // Fetch authorization token by posting api key and encrypted hash string
    var apiLogin = 'emammadovmd@gmail.com';
    const responseToken = await fetch(uri, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiLogin}:${computedHashString}`,
      },
    });
    token = await responseToken.json();
    token = token.Token;

    // Fetch symptoms from API for selection
    const apiSymptomsUrl = `${dataUrl}/symptoms?token=${token}&format=json&language=en-gb`;
    const response = await fetch(apiSymptomsUrl);
    symptomsArray = await response.json();
    console.log(symptomsArray);
    populateSymptoms();
  } catch (error) {
    // Catch error here
    console.log('Error fetching symptoms data', error);
  }
}

function addSymptom(event) {
  event.preventDefault();
  if (selectedSymptoms.includes(selectedSymptomID)) {
    alert('You have already added ' + selectedSymptomName);
  } else {
    // Read the chosen symptom option
    const selectedIndex = symptomSelection.selectedIndex;
    selectedSymptomID = symptomSelection.options[selectedIndex].value;
    const selectedText = symptomSelection.options[selectedIndex].text;
    selectedSymptomName = selectedText;

    // Add symptom to the symptoms list
    selectedSymptoms.push(selectedSymptomID);
    console.log(selectedSymptoms);
    chosenSymptomNames.push(selectedSymptomName);
    console.log(chosenSymptomNames);

    const newSymptom = document.createElement('div');
    newSymptom.textContent = selectedSymptomName;
    newSymptom.innerHTML += `<i class="fa-solid fa-delete-left" id="${selectedSymptomID}"></i>`;
    newSymptom.addEventListener('click', () => {
      newSymptom.remove();
      selectedSymptoms.pop();
      chosenSymptomNames.pop();
    });
    yourSymptomsContainer.appendChild(newSymptom);
  }
}

function deleteSymptom() {}

function clickSymptoms(event) {
  // Handling symptoms click
  console.log('Event target value ', event.target.value);
  const selectedIndex = symptomSelection.selectedIndex;

  selectedSymptomID = symptomSelection.options[selectedIndex].value;
  const selectedText = symptomSelection.options[selectedIndex].text;
  console.log(selectedText, selectedSymptomID);
  selectedSymptomName = selectedText;
}

function selectSymptoms(event) {
  event.preventDefault();
}

function submitForm(event) {
  event.preventDefault();

  // Determine sex
  const maleElement = document.getElementById('male');
  const femaleElement = document.getElementById('female');

  if (maleElement.checked) {
    sex = 'male';
  } else if (femaleElement.checked) {
    sex = 'female';
  }

  // Determine birthyear
  birthyear = selectYear.value;
  console.log(birthyear);

  if (selectedSymptoms.length === 0) {
    alert('Add at least one symptom!');
    return;
  }

  getDiagnoses();
}

async function getDiagnoses() {
  // Fetch diagnoses for submitted symptoms
  console.log(selectedSymptoms, sex, birthyear);
  const apiDiagnosisUrl = `${dataUrl}/diagnosis?symptoms=[${selectedSymptoms}]&gender=${sex}&year_of_birth=${birthyear}&token=${token}&format=json&language=en-gb`;
  const response = await fetch(apiDiagnosisUrl);
  diagnosesArray = await response.json();

  console.log(diagnosesArray);
  displayDiagnoses();
}

function displayDiagnoses() {
  // Display fetched diagnoses for chosen symptom(s)
  // First clear all previous diagnoses
  diagnosesContainer.innerHTML = '';

  diagnosesArray.forEach((diagnosis, index) => {
    const eachDiagnosis = document.createElement('div');
    eachDiagnosis.textContent = `Diagnosis #${index + 1}: ${
      diagnosis.Issue.ProfName
    } - likelihood ${Math.trunc(diagnosis.Issue.Accuracy)}%`;
    eachDiagnosis.innerHTML += `<i class="fa-solid fa-angle-down"></i>`;
    eachDiagnosis.classList.add('each-diagnosis');
    let infoShown = false;

    eachDiagnosis.addEventListener('click', async () => {
      if (infoShown) {
        eachDiagnosis.removeChild(eachDiagnosis.children[1]);
        infoShown = false;
      } else {
        let diagnosisInfo = document.createElement('div');

        // Fetch API information about the specific condition
        console.log(diagnosis.Issue.ID);
        const apiIssueUrl = `${dataUrl}/issues/${diagnosis.Issue.ID}/info?token=${token}&format=json&language=en-gb`;
        const response = await fetch(apiIssueUrl);
        let issue = await response.json();

        eachDiagnosis.appendChild(diagnosisInfo);
        diagnosisInfo.innerHTML = `<br><div><b>Description:</b> ${issue.Description}</div><br><div><b>Condition:</b> ${issue.MedicalCondition}</div><br><div><b>Possible symptoms:</b> ${issue.PossibleSymptoms}</div><br><div><b>Management:</b> ${issue.TreatmentDescription}</div>`;
        infoShown = true;
      }
    });
    diagnosesContainer.appendChild(eachDiagnosis);

    // Implementing "Which specialist should I see?"
    if (specialistsElement.children[0])
      specialistsElement.removeChild(specialistsElement.children[0]);
    specialistsElement.removeAttribute('hidden');
    specialistsElement.addEventListener('click', getSpecializations);
  });
  if (diagnosesArray.length === 0) {
    diagnosesContainer.innerHTML =
      'No diagnoses match the constellation of your symptoms. Try adding less symptoms.';
  }
}

async function getSpecializations() {
  if (specializationsOpen) {
    if (specialistsElement.children[0])
      specialistsElement.removeChild(specialistsElement.children[0]);
    specializationsOpen = false;
  } else {
    const response = await fetch(
      `${dataUrl}/diagnosis/specialisations?symptoms=[${selectedSymptoms}]&gender=${sex}&year_of_birth=${birthyear}&token=${token}&format=json&language=en-gb`
    );
    let specializations = await response.json();
    console.log(specializations);
    specializationsOpen = true;
    showSpecializations(specializations);
  }
}

function showSpecializations(specializations) {
  if (specialistsElement.children[0])
    specialistsElement.removeChild(specialistsElement.children[0]);
  const specialistsChildElement = document.createElement('div');
  specialistsElement.appendChild(specialistsChildElement);

  specializations.forEach((specialization, index) => {
    const eachSpecialization = document.createElement('div');
    eachSpecialization.textContent = `${index + 1}. ${
      specialization.Name
    } - necessity ${Math.trunc(specialization.Accuracy)}%`;
    specialistsChildElement.appendChild(eachSpecialization);
  });
}

// Listen for symptoms form submission and add symptom events
symptomSelection.addEventListener('click', clickSymptoms);
addSymptomsButton.addEventListener('click', addSymptom);
symptomsForm.addEventListener('submit', submitForm);

// Call on load
yearSelection();
getSymptoms();

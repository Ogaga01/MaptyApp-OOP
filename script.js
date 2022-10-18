'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
let workouts = [];
const zoomLevel = 13;
let map, mapEvent;

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  setDescription() {
    // prettier-ignore
    this.months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this.setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this.setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

const renderWorkouts = workout => {
  let html = `
        <li class="workout workout--${workout.type}" data-id=${workout.id}>
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">KM</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">MIN</span>
          </div>
    `;

  if (workout.type === 'running') {
    html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
        `;
  }

  if (workout.type === 'cycling') {
    html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
        `;
  }

  form.insertAdjacentHTML('afterend', html);
};

const setLocalStorage = () => {
  localStorage.setItem('workouts', JSON.stringify(workouts));
};

const getLocalStorage = () => {
  const data = JSON.parse(localStorage.getItem('workouts'));

  if (!data) return;

  workouts = data;

  workouts.forEach(workout => {
    renderWorkouts(workout);
  });
};

getLocalStorage();

const renderWorkoutsMarker = workout => {
  L.marker(workout.coords)
    .addTo(map)
    .bindPopup(
      L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: `${workout.type}-popup`,
      })
    )
    .setPopupContent(
      `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'} ${workout.description}`
    )
    .openPopup();
};

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    position => {
      const { latitude, longitude } = position.coords;
      const coords = [latitude, longitude];

      map = L.map('map').setView(coords, zoomLevel);

      L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      map.on('click', mapE => {
        mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
      });

      workouts.forEach(workout => {
        renderWorkoutsMarker(workout);
      });
    },
    () => {
      alert('Could not load map');
    }
  );
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const { lat, lng } = mapEvent.latlng;
  const distance = +inputDistance.value;
  const duration = +inputDuration.value;
  const type = inputType.value;
  let workout;

  const validInputs = (...inputs) => {
    return inputs.every(input => {
      return Number.isFinite(input);
    });
  };
  const positiveNumber = (...inputs) => {
    return inputs.every(input => {
      return input > 0;
    });
  };

  if (type === 'running') {
    const cadence = +inputCadence.value;

    if (
      !validInputs(distance, duration, cadence) ||
      !positiveNumber(distance, duration, cadence)
    )
      return alert('Inputs have to be positive numbers!');

    workout = new Running([lat, lng], distance, duration, cadence);

    renderWorkouts(workout);

    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.classList.add('hidden');
  }

  if (type === 'cycling') {
    const elevationGain = +inputElevation.value;

    if (
      !validInputs(distance, duration, elevationGain) ||
      !positiveNumber(distance, duration)
    )
      return alert('Inputs have to be positive numbers!');

    workout = new Cycling([lat, lng], distance, duration, elevationGain);

    renderWorkouts(workout);

    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.classList.add('hidden');
  }

  renderWorkoutsMarker(workout);

  workouts.push(workout);
  setLocalStorage();
});

inputType.addEventListener('change', () => {
  inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
});

containerWorkouts.addEventListener('click', e => {
  const workoutEl = e.target.closest('.workout');

  if (!workoutEl) return;

  const workout = workouts.find(work => {
    return work.id === workoutEl.dataset.id;
  });

  map.setView(workout.coords, zoomLevel, {
    animate: true,
    pan: {
      duration: 1,
    },
  });
});

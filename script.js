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
const workouts = []
let map, mapEvent;

class Workout {
    date = new Date()
    id = (Date.now()+'').slice(-10)
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
}

class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
      this.elevationGain = elevationGain;
      this.calcSpeed()
    }
    
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60)
        return this.speed
    }
}

class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
      this.cadence = cadence;
      this.calcPace()
    }
    
    calcPace() {
        this.pace = this.duration / this.distance
        return this.pace
    }
}

const run = new Running([6, 5], 30, 600, 300)
const ride = new Cycling([6, 5], 7, 11, 500)
console.log(run, ride)

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords
        const coords = [latitude, longitude]

        map = L.map('map').setView(coords, 13);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        map.on('click', (mapE) => {
            mapEvent = mapE
            form.classList.remove('hidden')
            inputDistance.focus()
        })
    }, () => {
        alert('Could not load map')
    })
}

form.addEventListener('submit', (e) => {
    e.preventDefault()
    console.log(mapEvent);
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

      inputCadence.value =
        inputDistance.value =
        inputDuration.value =
        inputElevation.value =
          '';
      form.classList.add('hidden');
    }

    L.marker([lat, lng])
      .addTo(map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${type}-popup`,
        })
      )
      .setPopupContent('Workout')
        .openPopup();
    
    workouts.push(workout)
    console.log(workouts)
})

inputType.addEventListener('change', () => {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
})


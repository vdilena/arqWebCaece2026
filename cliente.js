fetch('http://localhost:8080/disponibilidades/especialista/nombre/Micaela%20Su%C3%A1rez')
  .then(response => response.json())
  .then(data => console.log(data));
fetch('http://localhost:8080/disponibilidades/especialista/nombre/Micaela%20Su%C3%A1rez')
  .then(response => response.json())
  .then(data => console.log(data));


document.getElementById("btnIngresar").addEventListener("click", () => {

  const username = document.querySelector("#username").value
  const password = document.getElementById("password").value
  const data = {
    username,
    password
  }

  console.log(JSON.stringify(data))

  fetch('http://localhost:8080/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data), // Convert object to JSON string
    })
    .then(response => response.json())
    .then(data => console.log(data));
})

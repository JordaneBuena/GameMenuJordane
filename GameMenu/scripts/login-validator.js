function validationChamps(){
 
    if (document.contactForm.name.value=='' || !/^[a-zA-Z\s]+$/.test(document.contactForm.name.value)){
      alert("merci de bien remplir votre nom avec des caractères de l'alphabet");
      document.getElementById("nameErr").innerText =
       "Please enter your name";
      nameErr=true;
     
    } else {
      nameErr= false; 
      document.getElementById("nameErr").innerText = "";
    }
    if (document.contactForm.email.value==''){
      alert("merci de bien remplir votre email");
      document.getElementById("emailErr").innerText =
      "Please enter your email";
      emailErr= true;

    } else {
        emailErr= false; 
        document.getElementById("emailErr").innerText = "";
      }
    
  
  
      // Prevent the form from being submitted if there are any errors
      if ((nameErr || emailErr ) == true) {
        return false;

      } else {
        // Creating a string from input data for preview
        var dataPreview =
          "You've entered the following details: \n" +
          'Full Name: ' +
          name +
          '\n' +
          'Email Address: ' +
          email +
          '\n';
        if (hobbies.length) {
          dataPreview += 'Hobbies: ' + hobbies.join(', ');
        }
        // Display input data in a dialog box before submitting the form
        alert(dataPreview);
      }
  };

 const isValidEmail = (email) =>{

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
}


 const isValidFirstName = (firstName)=> {
    const firstNamePattern = /^[A-Za-z]+(?:[-'\s][A-Za-z]+)*$/;
    return firstNamePattern.test(firstName);
}

 const isValidLastName = (lastName)=> {
    const lastNamePattern = /^[A-Za-z]+(?:[-'\s][A-Za-z]+)*$/;
    return lastNamePattern.test(lastName);
}

 const isValidCountry = (country)=> {
    const countryPattern = /^[A-Za-z\s-]+$/;
    return countryPattern.test(country);
}

 const  initializeGames = (baseImageLink) =>{
    return [
        {
            id: 1,
            name: "Fix the Bug",
            image: `${baseImageLink}/assets/bug.gif`,
            link: "https://bugfix.play929.com",
            maxWin: "200 000",
            min : 20,
            description : "You are given a broken code snippet and must find and fix the bug to win up to ",
            endDescription :" Test your coding skills, beat the timer, and claim the prize!",
        },
        {
            id: 2,
            name: "Write the Function",
            image: `${baseImageLink}/assets/func.gif`,
            maxWin : "500 000",
            min : 50,
            link: "https://function.play929.com",
            description : "You are tasked with writing a function to solve a specific problem. Use your coding skills to implement the solution, and win up to ! ",
            endDescription :" play now and claim your prize",
        },
        {
            id: 3,
            name: "Optimize the Algorithm",
            image: `${baseImageLink}/assets/optimize.gif`,
            min: 100,
            link: "https://optimize.play929.com",
            maxWin : "1 000 000",
            description : "You are given an inefficient algorithm and must optimize it to improve its performance. Solve the challenge, and win up to ! ",
            endDescription :" play now and claim your prize!",
        }
    ];
};

module.exports = { isValidEmail, isValidFirstName, isValidLastName, isValidCountry  , initializeGames};

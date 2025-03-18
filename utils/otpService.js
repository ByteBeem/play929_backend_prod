const userLoginOTPs = new Map();

// Expiration time in milliseconds (3 minutes)
const OTP_EXPIRATION_TIME = 3 * 60 * 1000;


const storeOTP = (email, otp) => {
    const expirationTime = Date.now() + OTP_EXPIRATION_TIME;
    
   
    if (userLoginOTPs.has(email)) {
        
        userLoginOTPs.delete(email);
    }

    userLoginOTPs.set(email, { otp, expirationTime });
};


const getOTP = (email) => {
    const otpData = userLoginOTPs.get(email);

    if (!otpData) {
       
        return null;
    }

    if (Date.now() > otpData.expirationTime) {
      
        userLoginOTPs.delete(email);
        return null;
    }

    return otpData.otp;
};


const removeOTP = (email) => {
    if (userLoginOTPs.has(email)) {
        
        userLoginOTPs.delete(email);
    } else {
        return null;
    }
};

module.exports = { storeOTP, getOTP, removeOTP };

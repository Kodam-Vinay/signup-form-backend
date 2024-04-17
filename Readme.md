=> npm i typescript ts-node nodemon --save-dev => Add typescript and ts-node for run typescript on the NodeJS.
=> installed different types of dependencies for validaton of typescript @types/bcrypt, @types/cors, @types/jsonwebtoken,@types/nodemailer, and @types/validator": "^13.11.9
=> installed bcrypt package for hashing the password
=> installed jsonwebtoken to generate a token for authorization purpose
=> installed mongoose package for interaction with mongodb atlas
=> installed validator package for validation of email as well as password
=> installed nodemailer package to send the otp in mail format

//schema and model
=>created two schemas one is for user and another is for otp verification of user
==> in user schema the user should have f_name, l_name, password, email
==> in otp_verfication schema it should have the id of registered user as well the otp/token which is sended  
 through the mail
==> storing this otp and password in hash format using bcrypt
==> otp will expires after 10 min by using this code
createdAt: {
type: Date,
expires: 600,
default: Date.now(),
},
==>whenever the user register stored in db which unverified user after that the user need to enter the otp for
verification.
==>if the user trying to login but if it not verified user then it again generates otp with this we can compare the
entered otp and bcrpted otp stored in db
=> added different types of validations like password check, otp check...etc

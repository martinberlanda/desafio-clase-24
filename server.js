const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const bodyParser = require("body-parser");
const exphbs = require("express-handlebars");
const path = require("path");
const bcrypt = require("bcrypt");
const { Strategy } = require("passport-local");
const LocalStrategy = Strategy;
const passport = require("passport");

const connectMongo = require("connect-mongo");
const MongoStore = connectMongo.create({
  mongoUrl: "mongodb://localhost:27017/sesiones",
  ttl: 60,
});

const app = express();

let usersDB = [];

/* functions */
function isAuth(req, res, next) {
  if(req.isAuthenticated()){
      next()
  } else {
      res.redirect('/login')
  }
}

/*============================[Encriptacion]============================*/
const saltRounds = 10;

function encrypt(password) {
  return bcrypt.hashSync(password, saltRounds);
}

function compare(password, hash) {
  return bcrypt.compareSync(password, hash);
}

/*----------- Passport -----------*/
passport.use(
  new LocalStrategy((password, email, done) => {
    const userExist = usersDB.find((user) => {
      user.email == email;
    });

    if (!userExist) {
      console.log("Usuario no encontrado");
      return done(null, false);
    }

    if (!(userExist.password == password)) {
      console.log("Contraseña invalida");
      return done(null, false);
    }

    return done(null, userExist);
  })
);

passport.serializeUser((user, done) => {
  done(null, user.email);
});

passport.deserializeUser((email, done) => {
  const user = usersDB.find((user) => user.email == email);
  done(null, user);
});

/*============================[Middlewares]============================*/
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

/*----------- Session -----------*/
app.use(cookieParser());
app.use(
  session({
    store: MongoStore,
    secret: "123456789!@#$%^&*()",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: 'auto',
      maxAge: 60000, //60 seg
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

/*----------- Motor de plantillas -----------*/
app.set("views", path.join(path.dirname(""), "./src/views"));
app.engine(
  ".hbs",
  exphbs.engine({
    defaultLayout: "main",
    layoutsDir: path.join(app.get("views"), "layouts"),
    extname: ".hbs",
  })
);
app.set("view engine", ".hbs");

/*============================[Rutas]============================*/
app.get("/login", (req, res) => {
  console.log(usersDB)
  if (req.session.email) {
    res.redirect("/datos");
  } else {
    res.render("login");
  }
});

app.get("/datos", isAuth, (req, res) => {
    res.render("datos", { email: req.session.email });
});

/* app.post("/login", (req, res) => {
  if (req.session.name) {
    res.redirect("/datos");
  } else {
    req.session.name = req.body.name;
    res.redirect("/datos");
  }
}); */

app.post('/login', passport.authenticate('local', 
    {
        successRedirect: '/datos',
        failureRedirect: '/login-error'
    }
))

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/logout", (req, res) => {
  res.render("logout", { email: req.session.email });
  req.session.destroy();
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login-error", (req, res) => {
  res.render("login-error");
});

app.post("/register", (req, res) => {
  const { password, email } = req.body;

  const existingUser = usersDB.find((user) => user.email == email);
  if (existingUser) {
    res.render("register-error");
  } else {
    usersDB.push({ password, email });
    res.redirect("/login");
  }
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server running at ${PORT}`);
});

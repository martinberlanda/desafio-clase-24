import express from "express";
import dotenv from "dotenv";
import minimist from "minimist";
import { fork } from "child_process";
import cookieParser from "cookie-parser";
import session from "express-session";
import bodyParser from "body-parser";
import exphbs from "express-handlebars";
import path from "path";
import bcrypt from "bcrypt";
import connectMongo from "connect-mongo";
import passport from "passport";
import { Strategy } from "passport-local";
import UsuariosDaoMongoDb from "./src/daos/UsuariosDaoMongoDb.js";
const LocalStrategy = Strategy;

const forked = fork("./src/child.js");

dotenv.config();

let options = { alias: { p: "port" } };
const args = minimist(process.argv.slice(2), options);

const contenedor = new UsuariosDaoMongoDb();

const MongoStore = connectMongo.create({
  mongoUrl: process.env.MONGO_PATH,
  ttl: 60,
});

const app = express();

/* functions */
function isAuth(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/login");
  }
}

/*============================[Encriptacion]============================*/
const saltRounds = 10;

function encrypt(password) {
  return bcrypt.hash(password, saltRounds);
}

function compare(password, hash) {
  return bcrypt.compare(password, hash);
}

/*----------- Passport -----------*/
passport.use(
  new LocalStrategy(async (username, password, done) => {
    const userExist = await contenedor.findOne(username);

    if (!userExist) {
      console.log("Usuario no encontrado");
      return done(null, false);
    }

    const isPasswordCorrect = await compare(password, userExist.password);

    if (!isPasswordCorrect) {
      console.log("Contraseña invalida");
      return done(null, false);
    }

    return done(null, userExist);
  })
);

passport.serializeUser((user, done) => {
  done(null, user.username);
});

passport.deserializeUser(async (username, done) => {
  const user = await contenedor.findOne(username);
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
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: "auto",
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
app.get("/info", (req, res) => {
  res.send(
    JSON.stringify({
      args: args,
      plataform: process.platform,
      nodeVersion: process.version,
      memory: process.memoryUsage(),
      path: process.execPath,
      pid: process.pid,
      projectFolder: path.dirname(""),
    })
  );
});

app.get("/api/randoms", async (req, res) => {
  const quantity = req.query.quantity || 100000000;
  forked.send(quantity);
  forked.on("message", (message) => {
    res.send(message);
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/datos", isAuth, (req, res) => {
  console.log(req.user);
  res.render("datos", { email: req.user.email });
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/datos",
    failureRedirect: "/login-error",
  })
);

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/logout", (req, res) => {
  req.logOut();
  res.render("logout");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login-error", (req, res) => {
  res.render("login-error");
});

app.post("/register", async (req, res) => {
  let { username, password, email } = req.body;
  console.log(username, password, email);
  password = await encrypt(password);
  console.log(password);

  const userExist = await contenedor.findOne(username); //usersDB.find((user) => user.username == username);
  if (userExist) {
    res.render("register-error");
  } else {
    await contenedor.createOne({ username, password, email }); //usersDB.push({ username, password, email });
    res.redirect("/login");
  }
});

const PORT = args.p || 8080;
app.listen(PORT, () => {
  console.log(`Server running at ${PORT}`);
});

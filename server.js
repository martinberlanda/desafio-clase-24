const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const bodyParser = require("body-parser");
const exphbs = require("express-handlebars");
const path = require("path");

const connectMongo = require("connect-mongo");
const MongoStore = connectMongo.create({
  mongoUrl: 'mongodb+srv://coderhouse:coderhouse@cluster0.m8qjx.mongodb.net/sesiones?retryWrites=true&w=majority',
  ttl: 60,
});

const app = express();

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
      maxAge: 60000, //60 seg
    },
  })
);

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
  if (req.session.name) {
    res.redirect("/datos");
  } else {
    res.render("login");
  }
});

app.get("/datos", (req, res) => {
  if (req.session.name) {
    res.render("datos", { name: req.session.name });
  } else {
    res.redirect("/login");
  }
});

app.post("/login", (req, res) => {
  if (req.session.name) {
    res.redirect("/datos");
  } else {
    req.session.name = req.body.name;
    res.redirect("/datos");
  }
});

app.get("/", (req, res) => {
  res.send("Servidor express ok!");
});

app.get("/logout", (req, res) => {
  res.render("logout", { name: req.session.name });
  req.session.destroy();
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server running at ${PORT}`);
});

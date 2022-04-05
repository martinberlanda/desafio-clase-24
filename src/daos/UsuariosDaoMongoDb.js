import MongoDbContainer from "../containers/MongoDbContainer.js";
import { UserModel } from "../models/User.model.js";

export default class UsuariosDaoMongoDb extends MongoDbContainer {
  constructor() {
    super(UserModel);
  }
}

import mongoose from "mongoose";
const urlMongoDb = process.env.MONGO_PATH;

export default class MongoDbContainer {
  constructor(Model) {
    this.Model = Model;
  }

  async createOne(item) {
    let newItem;

    await mongoose
      .connect(urlMongoDb)
      .then(async () => {
        try {
          const itemCreated = new this.Model(item);
          await itemCreated.save();
          newItem = itemCreated;
        } catch (error) {
          console.error(`Error: ${error}`);
        } finally {
          await mongoose.disconnect().catch((err) => {
            console.error(err);
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });

    return newItem;
  }

  async findOne(username) {
    let item;
    await mongoose
      .connect(urlMongoDb)
      .then(async () => {
        try {
          let existingItem = await this.Model.findOne({ username });
          if (existingItem) item = existingItem;
          else
            return {
              error: "The next username didn't match any user: " + username,
            };
        } catch (error) {
          console.error(`Error: ${error}`);
        } finally {
          await mongoose.disconnect().catch((err) => {
            console.error(err);
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });

    return item;
  }

  async updateOne(id, item) {
    await mongoose.connect(urlMongoDb).then(async () => {
      try {
        await this.Model.updateOne({ _id: id }, { $set: item });
      } catch (error) {
        console.error(`Error: ${error}`);
      } finally {
        await mongoose.disconnect().catch((err) => {
          console.error(err);
        });
      }
    });
  }

  async findAll() {
    let items;
    await mongoose.connect(urlMongoDb).then(async () => {
      try {
        items = await this.Model.find();
      } catch (error) {
        console.error(`Error: ${error}`);
      } finally {
        await mongoose.disconnect().catch((err) => {
          console.error(err);
        });
      }
    });

    return items;
  }

  async deleteAll() {
    await mongoose.connect(urlMongoDb).then(async () => {
      try {
        await this.Model.deleteAll();
      } catch (error) {
        console.error(`Error: ${error}`);
      } finally {
        await mongoose.disconnect().catch((err) => {
          console.error(err);
        });
      }
    });
  }

  async deleteOne(id) {
    await mongoose.connect(urlMongoDb).then(async () => {
      try {
        await this.Model.deleteOne({ _id: id });
      } catch (error) {
        console.error(`Error: ${error}`);
      } finally {
        await mongoose.disconnect().catch((err) => {
          console.error(err);
        });
      }
    });
  }
}

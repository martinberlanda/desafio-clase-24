process.on("message", async (quantity) => {
    console.log(`Received message: ${quantity}`);
    const randomNumbers = {};
    for (let i = 0; i < quantity; i++) {
        const randomNumber = Math.floor(Math.random() * 1000);
        if (randomNumbers[randomNumber]) {
            randomNumbers[randomNumber]++;
        } else {
            randomNumbers[randomNumber] = 1;
        }
    }
    process.send(randomNumbers);
    }
);
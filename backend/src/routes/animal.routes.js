const express = require('express');
const router = express.Router();
const animalController = require('../controllers/animal.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/stats', protect, animalController.getAnimalStats); // ← added
router.get('/',      protect, animalController.getAllAnimals);
router.get('/:id',   protect, animalController.getAnimalById);
router.post('/',     protect, animalController.createAnimal);
router.put('/:id',   protect, animalController.updateAnimal);
router.delete('/:id',protect, animalController.deleteAnimal);

module.exports = router;
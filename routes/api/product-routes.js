
const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// get all products

router.get('/', async (req, res) => {
  try {
    const productValue = await Product.findAll({
      attributes: ['id', 'product_name'],
      include: [
        { model: Category },
        { model: Tag }
      ],
    })
    res.status(200).json(productValue);
  } catch (err) {
    res.status(400).json(err);
  }
});

// get one product
// find a single product by its `id`
// be sure to include its associated Category and Tag data

router.get('/:id', async (req, res) => {
  try {
    const productValue = await Product.findByPk(req.params.id, {
      include: [
        { model: Category },
        { model: Tag }
      ],
    });

    if (!productValue) {
      res.status(404).json
        ({ message: 'No product found with Id specified' });
      return;
    }

    res.status(200).json(productValue);
  } catch (err) {
    res.status(400).json(err);
  }
});

// create new product
router.post('/', async (req, res) => {
  const tagId = req.body.tagId || [];
  try {
    const productValue = await Product.create({
      product_name: req.body.product_name,
      price: req.body.price,
      stock: req.body.stock,
      category_id: req.body.category_id,
    })
    if (tagId.length) {
      console.log(typeof tagId)
      const productTagIdArr = tagId.map((tag_id) => {
        return {
          product_id: productValue.id,
          tag_id,
        };
      });
      const productTagId = await ProductTag.bulkCreate(productTagIdArr);
      console.log(productTagId);

    }
    productValue.getTags();
    res.status(200).json(productValue);
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  };
});

// update product
router.put('/:id', (req, res) => {
  Product.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((product) => {
      res.json(product)
      return ProductTag.findAll({ where: { product_id: req.params.id } });
    })
    .then((productTags) => {
      // map list of producttag id
      const productTagId = productTags.map(({ tag_id }) => tag_id);
      // create filtered list of new tag_ids
      const newTag = req.body.tagId
        .filter((tag_id) => !productTagId.includes(tag_id))
        .map((tag_id) => {
          return {
            product_id: req.params.id,
            tag_id,
          };
        });
      // figure out which ones to remove
      const productTagsToRemove = productTags
        .filter(({ tag_id }) => !req.body.tagId.includes(tag_id))
        .map(({ id }) => id);
      // run both actions
      return Promise.all([
        ProductTag.destroy({ where: { id: productTagsToRemove } }),
        ProductTag.bulkCreate(newTag),
      ]);
    })
    .then((updatedProductTags) => res.json(updatedProductTags))
    .catch((err) => {
      res.status(400).json(err);
    });
});

// delete one product by its `id` value

router.delete('/:id', async (req, res) => {
  try {
    const deleteProduct = await Product.destroy(
      {
        where: {
          id: req.params.id
        }
      }).then(deleteProduct => (deleteProduct) ? res.status(200).json : res.status(404).json
        ({ message: 'No Id found' }));
  } catch (err) {
    res.status(400).json(err)
  }
});

module.exports = router;
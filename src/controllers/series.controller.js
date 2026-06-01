import Series from "../models/Series.js";

export const createSeries = async (req, res) => {
  const series = await Series.create({
    title: req.body.title,
    description: req.body.description,
    author: req.user._id,
    language: req.body.language,
  });

  res.json(series);
};

export const getMySeries = async (req, res) => {
  const list = await Series.find({ author: req.user._id });
  res.json(list);
};

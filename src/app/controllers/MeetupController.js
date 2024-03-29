import * as Yup from 'yup';
import { Op } from 'sequelize';
import {
  startOfDay,
  parseISO,
  isBefore,
  endOfDay,
  startOfHour,
} from 'date-fns';

import Meetup from '../models/Meetup';
import User from '../models/User';

class MeetupController {
  async index(req, res) {
    const where = {};
    const { page = 1 } = req.query.page;

    if (req.query.date) {
      const seachDate = parseISO(req.query.date);
      where.date = {
        [Op.between]: [startOfDay(seachDate), endOfDay(seachDate)],
      };
    }

    const meetups = await Meetup.findAll({
      where,
      limit: 10,
      include: [
        {
          model: User, // uppercase
          as: 'user',
          attributes: ['name', 'email'],
        },
      ],
      offset: (page - 1) * 10,
    });

    return res.json(meetups);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      locale: Yup.string().required(),
      date: Yup.date().required(),
      image_id: Yup.number(),
      user_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.json(400).json({ error: 'Validations Fails' });
    }

    // Validation past date
    const hourStart = startOfHour(parseISO(req.body.date));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past Dates are not permitted' });
    }

    const meetup = await Meetup.create(req.body);
    return res.json(meetup);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      locale: Yup.string().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid)) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const meetup = await Meetup.findByPk(req.params.id);

    if (!meetup) {
      return res.status(400).json({ error: 'Meetup not found' });
    }

    // Validation past date
    const hourStart = startOfHour(parseISO(req.body.date));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Can not edit pass Meetups' });
    }

    if (meetup.user_id !== req.userId) {
      return res
        .status(400)
        .json({ error: 'Can not edit Meetups if you are not organizator' });
    }

    meetup.update(req.body);

    return res.json(meetup);
  }

  async delete(req, res) {
    const meetup = await Meetup.findByPk(req.params.id);

    if (!meetup) {
      return res.status(400).json({ error: 'Meetup not found' });
    }

    if (meetup.user_id !== req.userId) {
      return res
        .status(400)
        .json({ error: 'Can not edit Meetups if you are not organizator' });
    }

    // Validation past date
    const hourStart = startOfHour(parseISO(meetup.date));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Can not edit pass Meetups' });
    }

    await meetup.destroy();

    return res.send();
  }
}

export default new MeetupController();

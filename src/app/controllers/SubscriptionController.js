import { startOfHour, parseISO, isBefore } from 'date-fns';
import Subscription from '../models/Subscription';
import User from '../models/User';
import Meetup from '../models/Meetup';

import Mail from '../../lib/Mail';

class SubscriptionController {
  async index(req, res) {
    const subscriptions = await Subscription.findAll({
      where: { user_id: req.userId },
    });
    return res.json(subscriptions);
  }

  // store = add
  async store(req, res) {
    // User exist's ?
    const user = await User.findByPk(req.body.user_id);

    if (!user) {
      return res.status(401).json({ error: 'User not Exists' });
    }

    // meetup exist's ?
    const meetup = await Meetup.findByPk(req.body.meetup_id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email'],
        },
      ],
    });

    if (!meetup) {
      return res.status(401).json({ error: 'Meetup not Exists' });
    }

    // Second Sunscription Validate
    const secondSubscription = await Subscription.findOne({
      where: {
        user_id: user.id,
        meetup_id: meetup.id,
      },
    });

    if (secondSubscription) {
      return res.status(401).json({
        error: 'You not permit to subscribe two time in the same meetup',
      });
    }

    // Validation past date
    const hourStart = startOfHour(parseISO(meetup.date));

    if (isBefore(hourStart, new Date())) {
      return res
        .status(400)
        .json({ error: 'Can not Subscribe in pass Meetups' });
    }

    const subscription = await Subscription.create({
      user_id: user.id,
      meetup_id: meetup.id,
    });

    await Mail.sendMail({
      to: `${meetup.user.name} <${meetup.user.email}>`,
      subject: 'Nova Inscrição',
      text: `Nova subscrição no meetup - ${meetup.title}`,
    });

    return res.json(subscription);
  }
}

export default new SubscriptionController();

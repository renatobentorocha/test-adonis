'use strict'

const moment = require('moment')
const crypto = require('crypto')
const User = use('App/Models/User')
const Mail = use('Mail')

class ForgotPasswordController {
  async store ({ request, response }) {
    try {
      const email = request.input('email')

      const user = await User.findByOrFail('email', email)

      user.token = crypto.randomBytes(10).toString('hex')

      user.token_created_at = new Date()

      await user.save()

      Mail.send(
        ['emails.forgot_password'],
        {
          email,
          token: user.token,
          link: `${request.input('redirect_url')}?token=${user.token}`
        },
        message => {
          message
            .to(user.email)
            .from('renatob.rocha@gmail.com', 'Renato Rocha')
            .subject('Recuperação de senha')
        }
      )
    } catch (error) {
      console.log(error)
      return response
        .status(error.status)
        .send({ error: { message: 'Algo não deu certo, este e-mail existe?' } })
    }
  }

  async update ({ request, response }) {
    try {
      const { token, password } = request.all()

      const user = await User.findByOrFail('token', token)

      const tokenExpired = moment()
        .subtract('2', 'days')
        .isAfter(user.token_created_at)

      if (tokenExpired) {
        return response
          .status(401)
          .send({ error: { message: 'Token expirado...' } })
      }

      user.token_created_at = null
      user.token = null
      user.password = password

      await user.save()

      return user
    } catch (error) {
      console.log(error)
      return response
        .status(error.status)
        .send({ error: { message: 'Algo não deu certo...' } })
    }
  }
}

module.exports = ForgotPasswordController

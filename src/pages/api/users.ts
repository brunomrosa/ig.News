import {NextApiRequest, NextApiResponse} from 'next'

export default (request: NextApiRequest, response: NextApiResponse) => {
  const users = [
    {id: 1, name: 'Bruno'},
    {id: 2, name: 'Daniel'},
    {id: 3, name: 'Rafael'},
    {id: 4, name: 'Breno'},
  ]
  return response.status(200).json(users)
}
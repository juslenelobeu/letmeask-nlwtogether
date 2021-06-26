import { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { database } from '../services/firebase'
import { useAuth } from './useAuth'

type FirebaseQuestions = Record<string, {
  author: {
    name: string
    avatar: string
  }
  content: string
  isHighlighted: boolean
  isAnswered: boolean
  likes: Record<string, {
    authorId: string
  }>
}>

type QuestionTypes = {
  id: string
  author: {
    name: string
    avatar: string
  }
  content: string
  isAnswered: boolean
  isHighlighted: boolean
  likeCount: number
  likeId: string | undefined
}

export function useRoom(roomId: string) {
  const history = useHistory()
  const { user } = useAuth()
  const [questions, setQuestions] = useState<QuestionTypes[]>([])
  const [title, setTitle] = useState('')

  useEffect(() => {
    const roomRef = database.ref(`rooms/${roomId}`)

    roomRef.get().then(room => {
      if (room.val().endedAt) {
        history.push('/')
      } else {
        roomRef.on('value', room => {
          const databaseRoom = room.val()
          const firebaseQuestions: FirebaseQuestions = databaseRoom.questions ?? {}

          const parsedQuestions = Object.entries(firebaseQuestions).map(([key, value]) => {
            return {
              id: key,
              content: value.content,
              author: value.author,
              isHighlighted: value.isHighlighted,
              isAnswered: value.isAnswered,
              likeCount: Object.values(value.likes ?? {}).length,
              likeId: Object.entries(value.likes ?? {}).find(([key, like]) => like.authorId === user?.id)?.[0],
            }
          })
          setTitle(databaseRoom.title)
          setQuestions(parsedQuestions)
        })
      }
    })

    return () => { roomRef.off('value') }
  }, [roomId, history, user?.id])
  return { questions, title }
}
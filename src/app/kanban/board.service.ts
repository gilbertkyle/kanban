import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { first, switchMap } from 'rxjs/operators';
import { Board, Task } from './board.model';
import * as firebase from "firebase/app";

@Injectable({
  providedIn: 'root'
})
export class BoardService {

  constructor(private afAuth: AngularFireAuth, private db: AngularFirestore) { }
  // create new board
  async createBoard(data: Board) {
    const user = await this.afAuth.authState.pipe(first()).toPromise();
    return this.db.collection('boards').add({
      ...data,
      uid: user?.uid,
      tasks: [{description: 'Hello!', label: 'yellow'}]
    })
  }

  //delete a board
  deleteBoard(boardId: string) {
    return this.db.collection('boards').doc(boardId).delete();
  }

  updateTasks(boardId: string, tasks: Task[]) {
    return this.db.collection('boards').doc(boardId).update({
      tasks
    })
  }

  removeTask(boardId: string, taskId: Task) {
    return this.db.collection('boards').doc(boardId).update({
      tasks: firebase.default.firestore.FieldValue.arrayRemove(taskId)
    })
  }

  // get all boards associated with a user
  getUserBoards() {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          
          return this.db
            .collection<Board>('boards', ref => 
              ref.where('uid', '==', user.uid).orderBy('priority')
            )
          .valueChanges({ idField: 'id' });
        } else {
          return [];
        }
      })
    );
  }

  // sort user boards
  sortBoards(boards: Board[]) {
    const db = firebase.default.firestore();
    const batch = db.batch();
    const refs = boards.map(board => db.collection('boards').doc(board.id))
    refs.forEach((ref, index) => batch.update(ref, {priority: index}));
    batch.commit();
  }
}

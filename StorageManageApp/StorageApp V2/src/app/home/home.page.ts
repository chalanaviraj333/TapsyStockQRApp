import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { DisplayItems } from '../display-items';
import { Remote } from '../remote';
import { NativeRingtones } from '@ionic-native/native-ringtones/ngx';
import { Storage } from '@capacitor/storage';
import { AlertController } from '@ionic/angular';
import { TextToSpeech } from '@ionic-native/text-to-speech/ngx';
import { OrderDetail } from '../order-detail';
import { Remoteorder } from '../remoteorder';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  private selectedProduct: any = {};
  private allProducts: Array<Remote> = [];
  public itemsTookList: Array<DisplayItems> = [];
  private orderList: Array<OrderDetail> = [];
  private updateRemoteQuantityTimer = null;
  private updateRemoteDatabaseHttpTimer = null;
  private updateOrderDetailsHttpTimer = null;

  constructor(
    private http: HttpClient,
    private ringtones: NativeRingtones,
    public alertController: AlertController,
    private tts: TextToSpeech
  ) {}

  ngOnInit() {
    Storage.get({ key: 'tookItemsArray' }).then((storedData) => {
      if (!storedData || !storedData.value) {
        return;
      }

      const datafromLocalStorage = JSON.parse(storedData.value);

      datafromLocalStorage.forEach((item) => {
        this.itemsTookList.push({
          key: null,
          tapsycode: item.tapsycode,
          boxnumber: item.boxnumber,
          productType: item.productType,
          image: item.image,
          numberofTook: item.numberofTook,
          date: new Date(item.date),
        });
      });
    });

    this.getAllOrders();
    this.getAllRemotes();

  }

  // get all remotes
  getAllRemotes() {
    this.allProducts = [];

    this.http
      .get<{ [key: string]: Remote }>(
        'https://tapsystock-a6450-default-rtdb.firebaseio.com/remotes.json'
      )
      .subscribe((resData) => {
        for (const key in resData) {
          if (resData.hasOwnProperty(key)) {
            this.allProducts.push({
              key,
              tapsycode: resData[key].tapsycode,
              boxnumber: resData[key].boxnumber,
              shell: resData[key].shell,
              qtyavailable: resData[key].qtyavailable,
              inbuildchip: resData[key].inbuildchip,
              inbuildblade: resData[key].inbuildblade,
              battery: resData[key].battery,
              buttons: resData[key].buttons,
              costperitem: resData[key].costperitem,
              frequency: resData[key].frequency,
              remotetype: resData[key].remotetype,
              productType: resData[key].productType,
              image: resData[key].image,
              notes: resData[key].notes,
              remoteinStock: resData[key].remoteinStock,
              compitablecars: resData[key].compitablecars,
              compitablebrands: resData[key].compitablebrands,
            });
          }
        }
      });
  }

  // get orderedList from database
  getAllOrders() {
    this.orderList = [];

    this.http
      .get<{ [key: string]: OrderDetail }>(
        'https://tapsystock-a6450-default-rtdb.firebaseio.com/all-orders.json'
      )
      .subscribe((resData) => {
        for (const key in resData) {
          if (resData.hasOwnProperty(key)) {
            this.orderList.push({
              key,
              year: resData[key].year,
              month: resData[key].month,
              remoteList: resData[key].remoteList,
              remoteshelllist: resData[key].remoteshelllist

            })
          }
        }
      });
  }

  setTookArrayToLocalStorage(itemsTookList: Array<DisplayItems>) {
    const data = JSON.stringify(itemsTookList);
    Storage.set({
      key: 'tookItemsArray',
      value: data,
    });
  }

  UploadOrderList(oneTimeOrderList: Array<Remoteorder>) {

    const currentMonth: number = new Date().getMonth() + 1;
    const currentYear: number = new Date().getFullYear();

    const monthOrderList: OrderDetail = this.orderList.find(
      (orderItems) => orderItems.month === currentMonth && orderItems.year == currentYear
    );

    console.log(monthOrderList);

    if (monthOrderList == undefined) {

      const newMonthDetails: OrderDetail = {
        key: null,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        remoteList: oneTimeOrderList,
        remoteshelllist: []
      }
      // send http request for this month first enterance with oneTimeOrderList
      this.http
          .post(
            'https://tapsystock-a6450-default-rtdb.firebaseio.com/all-orders.json',
            newMonthDetails
          )
          .subscribe((resData) => {
            // refreash the orderlist
            if (resData !== undefined) {
              if(this.updateOrderDetailsHttpTimer != null) {
                clearTimeout(this.updateOrderDetailsHttpTimer);
                this.updateOrderDetailsHttpTimer = null;
              }

              this.updateOrderDetailsHttpTimer = setTimeout(() => this.getAllOrders(), 5000)
            }
          });
    }
    else {
      const currentRemoteList: Array<Remoteorder> = monthOrderList.remoteList;

      oneTimeOrderList.forEach(orderdItem => {
        const iteminarray: Remoteorder = currentRemoteList.find((orderInArray) => orderInArray.tapsycode === orderdItem.tapsycode);

        if (iteminarray == undefined) {
          currentRemoteList.push(orderdItem);

          // put request to database
          this.http
          .put(
            `https://tapsystock-a6450-default-rtdb.firebaseio.com/all-orders/${monthOrderList.key}.json`,
            { ...monthOrderList, remoteList: currentRemoteList, key: null }
          )
          .subscribe((resData) => {
            // refreash the orderlist
            if (resData !== undefined) {
              if(this.updateOrderDetailsHttpTimer != null) {
                clearTimeout(this.updateOrderDetailsHttpTimer);
                this.updateOrderDetailsHttpTimer = null;
              }

              this.updateOrderDetailsHttpTimer = setTimeout(() => this.getAllOrders(), 5000)
            }
          });
        }
        else {
          const index = currentRemoteList.indexOf(iteminarray);
          currentRemoteList[index].quantity = currentRemoteList[index].quantity + orderdItem.quantity;

          // put request to database
          this.http
          .put(
            `https://tapsystock-a6450-default-rtdb.firebaseio.com/all-orders/${monthOrderList.key}.json`,
            { ...monthOrderList, remoteList: currentRemoteList, key: null }
          )
          .subscribe((resData) => {
            // refreash the orderlist
            if (resData !== undefined) {
              if(this.updateOrderDetailsHttpTimer != null) {
                clearTimeout(this.updateOrderDetailsHttpTimer);
                this.updateOrderDetailsHttpTimer = null;
              }

              this.updateOrderDetailsHttpTimer = setTimeout(() => this.getAllOrders(), 5000)
            }
          });
        }
      });

    }
  }

  sendDataToDatabase() {

    const oneTimeOrderList: Array<Remoteorder> = [];

    this.itemsTookList.forEach((item) => {
      if (item.productType == 'remote') {
        const currentItem: Remote = this.allProducts.find(
          (remote) => remote.tapsycode === item.tapsycode
        );

        if (oneTimeOrderList.length == 0) {
          oneTimeOrderList.push({tapsycode: item.tapsycode, quantity: 1});
        }
        else {
          const findmonthfromarray: Remoteorder = oneTimeOrderList.find(
            (order) => order.tapsycode === item.tapsycode
          )

          if (findmonthfromarray == undefined) {
            oneTimeOrderList.push({tapsycode: item.tapsycode, quantity: 1});
          }
          else {
            const index = oneTimeOrderList.indexOf(findmonthfromarray);
            oneTimeOrderList[index].quantity++;
          }
        }

        this.http
          .put(
            `https://tapsystock-a6450-default-rtdb.firebaseio.com/remotes/${currentItem.key}.json`,
            { ...currentItem, key: null }
          )
          .subscribe((resData) => {
            if (resData !== undefined) {
              const index = this.itemsTookList.indexOf(item, 0);
              if (index > -1) {
                this.itemsTookList.splice(index, 1);
                this.setTookArrayToLocalStorage(this.itemsTookList);
              }

              if(this.updateRemoteDatabaseHttpTimer != null) {
                clearTimeout(this.updateRemoteDatabaseHttpTimer);
                this.updateRemoteDatabaseHttpTimer = null;
              }

              this.updateRemoteDatabaseHttpTimer = setTimeout(() => this.getAllRemotes(), 100000);

            }
          });


      } else {
      }
    });

    this.UploadOrderList(oneTimeOrderList);
  }

  async onCLickUpload() {

    if (this.itemsTookList.length != 0) {
      const alert = await this.alertController.create({
        cssClass: 'my-custom-class',
        header: 'Upload Alert',
        message: 'Are youe sure you want to upload data to Database?',
        buttons: [
          {
            text: 'Yes',
            handler: () => {
              this.sendDataToDatabase();
            },
          },
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: 'alertBoxCancel',
          },
        ],
      });

      await alert.present();
    } else {
      return;
    }
  }

  _ionChange(event) {
    let searchItemArray: Array<any> = [];
    const enteredTapsyCode: string = event.target.value;

    if(this.updateRemoteQuantityTimer != null) {
      clearTimeout(this.updateRemoteQuantityTimer);
      this.updateRemoteQuantityTimer = null;
    }

    if(this.updateRemoteDatabaseHttpTimer != null) {
      clearTimeout(this.updateRemoteDatabaseHttpTimer);
      this.updateRemoteDatabaseHttpTimer = null;
    }

    this.updateRemoteQuantityTimer = setTimeout(() => this.sendDataToDatabase(), 10000);

    if (enteredTapsyCode && enteredTapsyCode.trim() != '') {
      searchItemArray = this.allProducts.filter((product) => {
        let searchWord = product.tapsycode;
        return (
          searchWord.toLowerCase().indexOf(enteredTapsyCode.toLowerCase()) > -1
        );
      });

      if (searchItemArray.length == 1) {
        this.selectedProduct = searchItemArray[0];

        if (this.selectedProduct != undefined) {
          this.selectedProduct.qtyavailable =
            this.selectedProduct.qtyavailable - 1;

            if (this.itemsTookList.length == 0) {
              const speckWord: string ="Box " + this.selectedProduct.boxnumber.toString();
              this.tts.speak({
              text: speckWord,
              locale: 'en-GB',
              rate: 1.5})
            .catch((reason: any) => console.log(reason));
          }
          else if (this.itemsTookList.length > 0 && this.itemsTookList[0].boxnumber !== this.selectedProduct.boxnumber)
          {
            const speckWord: string ="Box " + this.selectedProduct.boxnumber.toString();
              this.tts.speak({
              text: speckWord,
              locale: 'en-GB',
              rate: 1.5})
            .catch((reason: any) => console.log(reason));
          }
          else {
              this.ringtones.playRingtone(
              '/System/Library/Audio/UISounds/tweet_sent.caf'
            );
          }

          this.itemsTookList.unshift({
            key: null,
            tapsycode: this.selectedProduct.tapsycode,
            boxnumber: this.selectedProduct.boxnumber,
            productType: this.selectedProduct.productType,
            image: this.selectedProduct.image,
            date: new Date(),
            numberofTook: 1,
            numberofItemsAvailble: this.selectedProduct.qtyavailable,
          });
          event.target.value = '';

          this.setTookArrayToLocalStorage(this.itemsTookList);
        }
      }
      else {
        const speckWord: string ="Remote not found";
            this.tts.speak({
            text: speckWord,
            locale: 'en-GB',
            rate: 1.5});
        setTimeout(() => event.target.value = '', 1000);
      }
    }
  }

}

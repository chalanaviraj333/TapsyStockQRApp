import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { DisplayItems } from '../display-items';
import { Remote } from '../remote';
import { RemoteShell } from '../remote-shell';
import { NativeRingtones } from '@ionic-native/native-ringtones/ngx';
import { Storage } from '@capacitor/storage';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  private selectedProduct: any = {};
  private allProducts: Array<any> = [];
  public itemsTookList: Array<DisplayItems> = [];

  constructor(
    private http: HttpClient,
    private ringtones: NativeRingtones,
    public alertController: AlertController
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

    // min lenght 15

    // max length 33

    // this.http
    //   .get<{ [key: string]: RemoteShell }>(
    //     'https://tapsystock-a6450-default-rtdb.firebaseio.com/remote-shells.json'
    //   )
    //   .subscribe((resData) => {
    //     for (const key in resData) {
    //       if (resData.hasOwnProperty(key)) {
    //         this.allProducts.push({
    //           key,
    //           tapsycode: resData[key].tapsycode,
    //           boxnumber: resData[key].boxnumber,
    //           remotetype: resData[key].remotetype,
    //           productType: resData[key].productType,
    //           qtyavailable: resData[key].qtyavailable,
    //           compitablebrands: resData[key].compitablebrands,
    //           image: resData[key].image,
    //           inbuildblade: resData[key].inbuildblade,
    //           buttons: resData[key].buttons,
    //           notes: resData[key].notes,
    //           inStock: resData[key].inStock,
    //         });
    //       }
    //     }
    //   });
  }

  setTookArrayToLocalStorage(itemsTookList: Array<DisplayItems>) {
    const data = JSON.stringify(itemsTookList);
    Storage.set({
      key: 'tookItemsArray',
      value: data,
    });
  }

  sendDataToDatabase() {
    this.itemsTookList.forEach((item) => {
      if (item.productType == 'remote') {
        const currentItem: Remote = this.allProducts.find(
          (remote) => remote.tapsycode === item.tapsycode
        );

        this.http
          .post(
            'https://tapsystock-a6450-default-rtdb.firebaseio.com/item-orders.json',
            { ...item, image: null, numberofTook: null, key: null }
          )
          .subscribe((resData) => {
            console.log(resData);
          });

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
            }
          });
      } else if (this.selectedProduct.productType == 'remoteshell') {
        console.log('found');
        const currentItem: RemoteShell = this.allProducts.find(
          (remoteShell) => remoteShell.tapsycode === item.tapsycode
        );

        this.http
          .post(
            'https://tapsystock-a6450-default-rtdb.firebaseio.com/item-orders.json',
            { ...item, image: null, numberofTook: null, key: null }
          )
          .subscribe((resData) => {
            console.log(resData);
          });

        this.http
          .put(
            `https://tapsystock-a6450-default-rtdb.firebaseio.com/remote-shells/${currentItem.key}.json`,
            { ...currentItem, key: null }
          )
          .subscribe((resData) => {
            if (resData !== undefined) {
              const index = this.itemsTookList.indexOf(item, 0);
              if (index > -1) {
                this.itemsTookList.splice(index, 1);
                this.setTookArrayToLocalStorage(this.itemsTookList);
              }
            }
          });
      }
    });
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

    setTimeout(() => this.sendDataToDatabase(), 100000);

    if (enteredTapsyCode && enteredTapsyCode.trim() != '') {
      searchItemArray = this.allProducts.filter((product) => {
        let searchWord = product.tapsycode;
        return (
          searchWord.toLowerCase().indexOf(enteredTapsyCode.toLowerCase()) > -1
        );
      });

      console.log(searchItemArray.length);

      if (searchItemArray.length == 1) {
        this.selectedProduct = searchItemArray[0];

        if (this.selectedProduct != undefined) {
          this.selectedProduct.qtyavailable =
            this.selectedProduct.qtyavailable - 1;

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
          this.ringtones.playRingtone(
            '/System/Library/Audio/UISounds/tweet_sent.caf'
          );

          this.setTookArrayToLocalStorage(this.itemsTookList);
        }
      }
      else {
        setTimeout(() => event.target.value = '', 6000);
      }
    }
  }
}

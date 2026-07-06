QNAS便携式轻量化NAS系统 Ver 1.0

QNAS使用说明：

1. 在使用前，为了确保QNAS顺利运行，您的系统需要先安装Node.js，这是一个JavaScript运行环境，如果您的系统已经有Node.js，那么可以略过此步骤。

2. 双击根目录里的start.bat，会弹出一个命令窗口，这样QNAS就已经运行完成，注意，在NAS系统运行期间，请勿关闭这个命令窗口。

3. 接下来打开浏览器，输入http://localhost:8088，即可打开QNAS系统登录页面，QNAS系统默认使用8088端口，但如果您的8088端口无法启用，系统也会自动选择其他端口，您可以在日志文件logs\startup.log里查询使用的是哪个端口，然后把http://localhost:后面的8088改成该端口即可打开登录页面。

4. 现在，您局域网的设备，比如手机和平板电脑，都可以通过访问http://localhost:8088，进入到你作为NAS的电脑，对这台电脑的磁盘文件的进行访问和管理。

5. 系统默认只有一个管理员用户，用户名：admin，密码：admin123。登录后，您可以更改用户头像，也可以新增其他用户，点击页面左侧的用户名，然后在用户管理里添加新的账户，并赋予这些账户权限。

6. 开启外网访问功能，您需要将tools文件夹里的cloudflared.exe解压出来，放在tools文件夹的根目录里。

然后在QNAS系统页面左侧下方有基本的访问地址信息，如果您需要从外网访问这个NAS，那么请点击开启外网访问按钮，然后就可以获得一个外网地址，通过这个地址即可从外网访问到这台NAS。

QNAS的外网访问功能是通过Cloudflare加密隧道实现的，如果您NAS的电脑重启和关机，或QNAS系统的重启，都需要再次执行这个操作，以获得新的外网访问地址。同时也是由于加密隧道的原因，文件传输会比较慢，不太适合大容量文件的上传和下载，但它有效解决了NAS能够被外网访问的问题。
通常而言，只要您的NAS电脑不关机，QNAS一直稳定运行，这个地址就能一直被正常访问。
当您在外网能够正常访问NAS的时候，不要随意点击开启外网访问的按钮，这样它会生成一个新地址，而您的旧地址会立即失效无法再访问NAS，此时你必须在局域网登录进QNAS系统才能获知新地址。

7. 我们都知道数据无价，当您对文件进行删除操作的时候，它会被彻底删除，所以请谨慎操作。

8. QNAS的开发宗旨是打造一个人人都能拥有的轻量化NAS系统，没有太多繁琐操作和设置，即可实现在Windows里一样的文件管理操作。

------------------------------------------------------------------------------------------------------------------------------------------------------

QNAS使用説明：

1. QNASを正常に動作させるため、使用前にお使いのシステムへNode.jsのインストールが必要になる場合があります。Node.jsはJavaScriptの実行環境です。Node.jsフォルダー内にある「node-v24.18.0-x64.msi」を見つけて、インストールしてください。

2. Node.jsのインストールが完了したら、ルートディレクトリにある「start.bat」をダブルクリックしてください。コマンドウィンドウが表示され、これでQNASの起動は完了です。なお、NASシステムの実行中は、このコマンドウィンドウを閉じないでください。

3. 次にブラウザを開き、「[http://localhost:8088」と入力すると、QNASシステムのログインページを開くことができます。QNASシステムはデフォルトで8088ポートを使用します。ただし、8088ポートを使用できない場合、システムは自動的に別のポートを選択します。使用中のポートはログファイル「logs\startup.log」で確認できます。その後、「http://localhost:」の後ろの8088を該当するポート番号に変更すれば、ログインページを開くことができます。](http://localhost:8088」と入力すると、QNASシステムのログインページを開くことができます。QNASシステムはデフォルトで8088ポートを使用します。ただし、8088ポートを使用できない場合、システムは自動的に別のポートを選択します。使用中のポートはログファイル「logs\startup.log」で確認できます。その後、「http://localhost:」の後ろの8088を該当するポート番号に変更すれば、ログインページを開くことができます。)

4. これで、同じローカルネットワーク内のデバイス、たとえばスマートフォンやタブレットからも、「[http://localhost:8088」にアクセスすることで、NASとして使用しているパソコンに入り、そのパソコン上のディスクファイルへアクセスおよび管理を行うことができます。](http://localhost:8088」にアクセスすることで、NASとして使用しているパソコンに入り、そのパソコン上のディスクファイルへアクセスおよび管理を行うことができます。)

5. システムにはデフォルトで管理者ユーザーが1つだけ用意されています。ユーザー名：admin、パスワード：admin123 です。ログイン後、ユーザーアイコンを変更することができます。また、他のユーザーを追加することも可能です。ページ左側のユーザー名をクリックし、ユーザー管理から新しいアカウントを追加して、それぞれのアカウントに権限を付与してください。

6. 外部ネットワークアクセス機能を有効にします。ページ左側の下部には、基本的なアクセスアドレス情報が表示されています。外部ネットワークからこのNASへアクセスする必要がある場合は、「外部ネットワークアクセスを有効にする」ボタンをクリックしてください。すると外部アクセス用のアドレスを取得できます。このアドレスを使用することで、外部ネットワークからこのNASへアクセスできます。

QNASの外部ネットワークアクセス機能は、Cloudflareの暗号化トンネルによって実現されています。NASとして使用しているパソコンを再起動またはシャットダウンした場合、あるいはQNASシステムを再起動した場合は、新しい外部アクセスアドレスを取得するために、この操作を再度実行する必要があります。また、暗号化トンネルを使用しているため、ファイル転送速度は比較的遅く、大容量ファイルのアップロードやダウンロードにはあまり適していません。ただし、NASを外部ネットワークからアクセス可能にするという問題を効果的に解決できます。

通常、NASとして使用しているパソコンをシャットダウンせず、QNASが安定して稼働している限り、このアドレスは継続して正常にアクセスできます。

外部ネットワークからNASへ正常にアクセスできている場合は、「外部ネットワークアクセスを有効にする」ボタンをむやみにクリックしないでください。クリックすると新しいアドレスが生成され、古いアドレスは直ちに無効となり、NASへアクセスできなくなります。その場合、新しいアドレスを確認するには、ローカルネットワーク内からQNASシステムへログインする必要があります。

7. データは非常に重要です。ファイルを削除すると、そのファイルは完全に削除されます。操作には十分ご注意ください。

8. QNASの開発目的は、誰もが手軽に所有できる軽量NASシステムを作ることです。複雑な操作や設定を必要とせず、Windowsと同じようなファイル管理操作を実現できます。

------------------------------------------------------------------------------------------------------------------------------------------------------

QNAS User Guide:

1. Before using QNAS, your system may need to install Node.js to ensure that QNAS runs properly. Node.js is a JavaScript runtime environment. You can find “node-v24.18.0-x64.msi” in the Node.js folder. Please install it first.

2. After Node.js has been installed, double-click “start.bat” in the root directory. A command window will appear, which means QNAS has started successfully. Please note that while the NAS system is running, do not close this command window.

3. Next, open your browser and enter “[http://localhost:8088”](http://localhost:8088”) to open the QNAS system login page. QNAS uses port 8088 by default. However, if port 8088 cannot be enabled on your system, QNAS will automatically select another port. You can check which port is being used in the log file “logs\startup.log”. Then replace 8088 in “[http://localhost:8088”](http://localhost:8088”) with that port number to open the login page.

4. Now, devices on your local area network, such as mobile phones and tablets, can access “[http://localhost:8088”](http://localhost:8088”) to enter the computer being used as the NAS, and access and manage the disk files on that computer.

5. By default, the system has only one administrator account. The username is admin, and the password is admin123. After logging in, you can change the user avatar and add other users. Click the username on the left side of the page, then add new accounts in User Management and assign permissions to those accounts.

6. Enable external network access. Basic access address information is displayed at the lower-left area of the page. If you need to access this NAS from an external network, click the “Enable External Network Access” button. You will then receive an external access address, which can be used to access this NAS from outside your local network.

QNAS external network access is implemented through a Cloudflare encrypted tunnel. If the computer running the NAS is restarted or shut down, or if the QNAS system is restarted, you will need to perform this operation again to obtain a new external access address. Also, because the connection uses an encrypted tunnel, file transfers may be relatively slow. It is not very suitable for uploading or downloading large files, but it effectively solves the problem of making the NAS accessible from external networks.

Generally speaking, as long as your NAS computer is not shut down and QNAS continues running stably, this address can remain accessible normally.

When you can access the NAS normally from an external network, do not click the “Enable External Network Access” button unnecessarily. Doing so will generate a new address, and your old address will immediately become invalid, meaning it can no longer be used to access the NAS. In that case, you must log in to the QNAS system from the local area network to obtain the new address.

7. We all know that data is priceless. When you delete a file, it will be permanently deleted, so please proceed with caution.

8. The development goal of QNAS is to create a lightweight NAS system that everyone can own. Without complicated operations or settings, it allows you to manage files just like you would in Windows.

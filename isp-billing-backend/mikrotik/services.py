"""
MikroTik API Service for router communication
"""
import logging
from routeros_api import RouterOsApiPool
from routeros_api.exceptions import RouterOsApiConnectionError, RouterOsApiCommunicationError
from django.utils import timezone

logger = logging.getLogger(__name__)


class MikroTikService:
    """
    Service class for MikroTik router operations
    """
    
    def __init__(self, router):
        """
        Initialize MikroTik service with router instance
        """
        self.router = router
        self.connection = None
        self.api = None
    
    def connect(self):
        """
        Connect to MikroTik router
        """
        try:
            self.connection = RouterOsApiPool(
                host=self.router.ip_address,
                username=self.router.username,
                password=self.router.password,
                port=self.router.api_port,
                plaintext_login=True
            )
            self.api = self.connection.get_api()
            
            # Update router status
            self.router.is_online = True
            self.router.last_connected_at = timezone.now()
            self.router.save(update_fields=['is_online', 'last_connected_at'])
            
            logger.info(f"Connected to MikroTik router: {self.router.name}")
            return True
            
        except (RouterOsApiConnectionError, RouterOsApiCommunicationError) as e:
            logger.error(f"Failed to connect to {self.router.name}: {str(e)}")
            self.router.is_online = False
            self.router.save(update_fields=['is_online'])
            return False
        except Exception as e:
            logger.error(f"Unexpected error connecting to {self.router.name}: {str(e)}")
            return False
    
    def disconnect(self):
        """
        Disconnect from MikroTik router
        """
        try:
            if self.connection:
                self.connection.disconnect()
                logger.info(f"Disconnected from MikroTik router: {self.router.name}")
        except Exception as e:
            logger.error(f"Error disconnecting from {self.router.name}: {str(e)}")
    
    def create_queue_profile(self, package):
        """
        Create queue profile for package
        """
        if not self.connect():
            return False, "Failed to connect to router"
        
        try:
            queue_resource = self.api.get_resource('/queue/simple')
            
            # Prepare queue data
            max_limit = f"{package.bandwidth_download}M/{package.bandwidth_upload}M"
            
            queue_data = {
                'name': package.mikrotik_queue_name,
                'max-limit': max_limit,
                'priority': str(package.priority),
            }
            
            # Add burst settings if available
            if package.burst_limit_download and package.burst_limit_upload:
                queue_data['burst-limit'] = f"{package.burst_limit_download}M/{package.burst_limit_upload}M"
            
            if package.burst_threshold_download and package.burst_threshold_upload:
                queue_data['burst-threshold'] = f"{package.burst_threshold_download}M/{package.burst_threshold_upload}M"
            
            if package.burst_time:
                queue_data['burst-time'] = f"{package.burst_time}s/{package.burst_time}s"
            
            # Create queue
            result = queue_resource.add(**queue_data)
            
            logger.info(f"Created queue profile: {package.mikrotik_queue_name}")
            return True, result
            
        except Exception as e:
            error_str = str(e)
            if "already have such name" in error_str:
                # Queue already exists, try to find it and return success
                logger.info(f"Queue {package.mikrotik_queue_name} already exists, fetching ID")
                try:
                    existing = queue_resource.get(name=package.mikrotik_queue_name)
                    if existing:
                        return True, existing[0]
                except Exception as inner_e:
                    logger.error(f"Failed to fetch existing queue: {inner_e}")
            
            error_msg = f"Error creating queue profile: {error_str}"
            logger.error(error_msg)
            return False, error_msg
        finally:
            self.disconnect()
    
    def update_queue_profile(self, package, queue_id):
        """
        Update existing queue profile
        """
        if not self.connect():
            return False, "Failed to connect to router"
        
        try:
            queue_resource = self.api.get_resource('/queue/simple')
            
            # Prepare update data
            max_limit = f"{package.bandwidth_download}M/{package.bandwidth_upload}M"
            
            update_data = {
                '.id': queue_id,
                'name': package.mikrotik_queue_name,
                'max-limit': max_limit,
                'priority': str(package.priority),
            }
            
            # Add burst settings if available
            if package.burst_limit_download and package.burst_limit_upload:
                update_data['burst-limit'] = f"{package.burst_limit_download}M/{package.burst_limit_upload}M"
            
            if package.burst_threshold_download and package.burst_threshold_upload:
                update_data['burst-threshold'] = f"{package.burst_threshold_download}M/{package.burst_threshold_upload}M"
            
            if package.burst_time:
                update_data['burst-time'] = f"{package.burst_time}s/{package.burst_time}s"
            
            # Update queue
            queue_resource.set(**update_data)
            
            logger.info(f"Updated queue profile: {package.mikrotik_queue_name}")
            return True, "Queue updated successfully"
            
        except Exception as e:
            error_msg = f"Error updating queue profile: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
        finally:
            self.disconnect()
    
    def delete_queue_profile(self, queue_name):
        """
        Delete queue profile
        """
        if not self.connect():
            return False, "Failed to connect to router"
        
        try:
            queue_resource = self.api.get_resource('/queue/simple')
            
            # Find queue by name
            queues = queue_resource.get(name=queue_name)
            
            if queues:
                queue_id = queues[0]['id']
                queue_resource.remove(id=queue_id)
                logger.info(f"Deleted queue profile: {queue_name}")
                return True, "Queue deleted successfully"
            else:
                return False, "Queue not found"
            
        except Exception as e:
            error_msg = f"Error deleting queue profile: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
        finally:
            self.disconnect()
    
    def test_connection(self):
        """
        Test router connection
        """
        if not self.connect():
            return False, "Connection failed"
        
        try:
            # Try to get system identity
            resource = self.api.get_resource('/system/identity')
            identity = resource.get()
            
            self.disconnect()
            return True, f"Connected successfully. Router: {identity[0].get('name', 'Unknown')}"
            
        except Exception as e:
            self.disconnect()
            return False, str(e)
    
    def create_ppp_profile(self, package):
        """
        Create PPP Profile for package
        """
        if not self.connect():
            return False, "Failed to connect to router"
        
        try:
            profile_resource = self.api.get_resource('/ppp/profile')
            
            rate_limit = f"{package.bandwidth_upload}M/{package.bandwidth_download}M"
            
            profile_data = {
                'name': package.mikrotik_queue_name,
                'rate-limit': rate_limit,
            }
            
            # Create profile
            result = profile_resource.add(**profile_data)
            
            logger.info(f"Created PPP profile: {package.mikrotik_queue_name}")
            return True, result
            
        except Exception as e:
            error_msg = str(e)
            if "already have such name" in error_msg:
                logger.info(f"PPP Profile {package.mikrotik_queue_name} already exists")
                # Try to get ID
                try:
                    existing = profile_resource.get(name=package.mikrotik_queue_name)
                    if existing:
                        return True, existing[0]
                except:
                    pass
                return True, "Profile already exists"
                
            logger.error(f"Error creating PPP profile: {error_msg}")
            return False, error_msg
        finally:
            self.disconnect()

    # ==================== PPPoE User Management ====================
    
    def create_pppoe_user(self, subscription, force_link=False):
        """
        Create PPPoE user for subscription.
        If force_link is True, it will try to link to an existing user if a name collision occurs.
        """
        if not self.connect():
            return False, "Failed to connect to router"
        
        try:
            pppoe_resource = self.api.get_resource('/ppp/secret')
            
            # Prepare PPPoE user data
            user_data = {
                'name': subscription.mikrotik_username,
                'password': subscription.mikrotik_password,
                'service': 'pppoe',
                'profile': subscription.package.mikrotik_queue_name,
                'comment': f"Customer: {subscription.customer.customer_id}"
            }
            
            # Add static IP if customer has one
            if subscription.customer.static_ip:
                user_data['remote-address'] = str(subscription.customer.static_ip)
            
            # Create user
            result = pppoe_resource.add(**user_data)
            
            logger.info(f"Created PPPoE user: {subscription.mikrotik_username}")
            return True, result
            
        except Exception as e:
            error_str = str(e)
            
            if "already have such name" in error_str or "already exists" in error_str:
                 # Check if force link is requested
                 if force_link:
                    logger.info(f"Force linking existing PPPoE user {subscription.mikrotik_username}")
                    try:
                        existing = pppoe_resource.get(name=subscription.mikrotik_username)
                        if existing:
                            # If found, return success with existing ID
                            return True, existing[0]
                    except Exception as inner_e:
                        logger.error(f"Failed to fetch existing user for linking: {inner_e}")
                        # Fall through to error
                 
                 logger.warning(f"PPPoE user {subscription.mikrotik_username} collision in MikroTik")
                 return False, f"User '{subscription.mikrotik_username}' already exists in MikroTik. Please delete it from router or use a different username."
            
            error_msg = f"Error creating PPPoE user: {error_str}"
            logger.error(error_msg)
            return False, error_msg
        finally:
            self.disconnect()
    
    def update_pppoe_user(self, subscription, user_id):
        """
        Update existing PPPoE user
        """
        if not self.connect():
            return False, "Failed to connect to router"
        
        try:
            pppoe_resource = self.api.get_resource('/ppp/secret')
            
            # Prepare update data
            update_data = {
                '.id': user_id,
                'name': subscription.mikrotik_username,
                'password': subscription.mikrotik_password,
                'profile': subscription.package.mikrotik_queue_name,
            }
            
            # Update static IP if available
            if subscription.customer.static_ip:
                update_data['remote-address'] = str(subscription.customer.static_ip)
            
            # Update user
            pppoe_resource.set(**update_data)
            
            logger.info(f"Updated PPPoE user: {subscription.mikrotik_username}")
            return True, "PPPoE user updated successfully"
            
        except Exception as e:
            error_msg = f"Error updating PPPoE user: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
        finally:
            self.disconnect()
    
    def enable_pppoe_user(self, username):
        """
        Enable PPPoE user (activate subscription)
        """
        if not self.connect():
            return False, "Failed to connect to router"
        
        try:
            pppoe_resource = self.api.get_resource('/ppp/secret')
            
            # Find user by name
            users = pppoe_resource.get(name=username)
            
            if users:
                user_id = users[0]['id']
                pppoe_resource.set(id=user_id, disabled='no')
                logger.info(f"Enabled PPPoE user: {username}")
                return True, "User enabled successfully"
            else:
                return False, "User not found"
            
        except Exception as e:
            error_msg = f"Error enabling PPPoE user: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
        finally:
            self.disconnect()
    
    def disable_pppoe_user(self, username):
        """
        Disable PPPoE user (suspend subscription)
        """
        if not self.connect():
            return False, "Failed to connect to router"
        
        try:
            pppoe_resource = self.api.get_resource('/ppp/secret')
            
            # Find user by name
            users = pppoe_resource.get(name=username)
            
            if users:
                user_id = users[0]['id']
                pppoe_resource.set(id=user_id, disabled='yes')
                logger.info(f"Disabled PPPoE user: {username}")
                return True, "User disabled successfully"
            else:
                return False, "User not found"
            
        except Exception as e:
            error_msg = f"Error disabling PPPoE user: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
        finally:
            self.disconnect()
    
    def delete_pppoe_user(self, username):
        """
        Delete PPPoE user (cancel subscription)
        """
        if not self.connect():
            return False, "Failed to connect to router"
        
        try:
            pppoe_resource = self.api.get_resource('/ppp/secret')
            
            # Find user by name
            users = pppoe_resource.get(name=username)
            
            if users:
                user_id = users[0]['id']
                pppoe_resource.remove(id=user_id)
                logger.info(f"Deleted PPPoE user: {username}")
                return True, "User deleted successfully"
            else:
                return False, "User not found"
            
        except Exception as e:
            error_msg = f"Error deleting PPPoE user: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
        finally:
            self.disconnect()

    # ==================== Live Status ====================

    def get_active_connections(self):
        """
        Fetch all active PPP connections
        """
        if not self.connect():
            return []
            
        try:
            active_resource = self.api.get_resource('/ppp/active')
            active_connections = active_resource.get()
            return active_connections
        except Exception as e:
            logger.error(f"Error fetching active connections: {e}")
            return []
        finally:
            self.disconnect()
